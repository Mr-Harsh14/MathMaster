import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz from '@/models/Quiz'
import Score from '@/models/Score'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    // Get all quizzes and scores based on user's role and filters
    let quizzes
    let scores

    if (user.role === 'TEACHER') {
      if (classId) {
        // Get class-specific data for teachers
        const classData = await Class.findOne({
          _id: classId,
          teacher: user._id
        })

        if (!classData) {
          return NextResponse.json(
            { message: 'Class not found or access denied' },
            { status: 404 }
          )
        }

        quizzes = await Quiz.find({ class: classId })
      } else {
        // Get all quizzes from teacher's classes
        const teacherClasses = await Class.find({ teacher: user._id })
        quizzes = await Quiz.find({ class: { $in: teacherClasses.map(c => c._id) } })
      }
    } else {
      // For students, only show scores from their enrolled classes
      const studentClasses = await Class.find({ students: user._id })
      if (classId) {
        // Verify student is enrolled in the class
        if (!studentClasses.some(c => c._id.toString() === classId)) {
          return NextResponse.json(
            { message: 'Class not found or access denied' },
            { status: 404 }
          )
        }
        quizzes = await Quiz.find({ class: classId })
      } else {
        quizzes = await Quiz.find({ class: { $in: studentClasses.map(c => c._id) } })
      }
    }

    // Get scores for the filtered quizzes
    scores = await Score.find({
      quiz: { $in: quizzes.map(quiz => quiz._id) }
    })
    .populate('user', 'name email')
    .populate({
      path: 'quiz',
      select: 'class',
      populate: {
        path: 'class',
        select: 'name'
      }
    })
    .lean()

    // Calculate student rankings
    const studentScores = new Map()

    scores.forEach(score => {
      const userId = score.user._id.toString()
      if (!studentScores.has(userId)) {
        studentScores.set(userId, {
          student: score.user,
          totalScore: 0,
          totalMaxScore: 0,
          quizzesTaken: 0,
          classesTaken: new Set(),
        })
      }

      const studentData = studentScores.get(userId)
      studentData.totalScore += score.score
      studentData.totalMaxScore += score.maxScore
      studentData.quizzesTaken += 1
      studentData.classesTaken.add(score.quiz.class._id.toString())
    })

    // Convert to array and calculate percentages
    const rankings = Array.from(studentScores.values())
      .map(data => ({
        studentName: data.student.name || data.student.email,
        averageScore: data.totalMaxScore > 0
          ? Math.round((data.totalScore / data.totalMaxScore) * 100)
          : 0,
        quizzesTaken: data.quizzesTaken,
        classCount: data.classesTaken.size,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)

    return NextResponse.json(rankings)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { message: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
} 