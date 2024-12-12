import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz from '@/models/Quiz'
import Score from '@/models/Score'

export async function GET() {
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

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get all classes where the user is the teacher
    const teacherClasses = await Class.find({ teacher: user._id }).lean()
    
    if (!teacherClasses.length) {
      return NextResponse.json([])
    }

    const classIds = teacherClasses.map(c => c._id)

    // Get all students who are in any of these classes
    const studentsInClasses = await Class.find({ _id: { $in: classIds } })
      .populate('students', 'name email')
      .lean()

    // Create a unique set of student IDs
    const uniqueStudentIds = new Set()
    const uniqueStudents = []
    
    studentsInClasses.forEach(cls => {
      cls.students?.forEach((student: any) => {
        if (!uniqueStudentIds.has(student._id.toString())) {
          uniqueStudentIds.add(student._id.toString())
          uniqueStudents.push(student)
        }
      })
    })

    if (!uniqueStudents.length) {
      return NextResponse.json([])
    }

    // Get all quizzes for these classes
    const quizzes = await Quiz.find({ class: { $in: classIds } }).lean()
    const quizIds = quizzes.map(q => q._id)

    // Get all scores for these quizzes
    const scores = await Score.find({
      quiz: { $in: quizIds },
      user: { $in: Array.from(uniqueStudentIds) }
    })
    .populate('quiz', 'title class')
    .lean()

    // Process student data
    const processedStudents = await Promise.all(uniqueStudents.map(async (student) => {
      // Get classes this student is enrolled in
      const enrolledClasses = teacherClasses.filter(cls => 
        cls.students?.some((s: any) => s.toString() === student._id.toString())
      )

      // Get scores for this student
      const studentScores = scores.filter(score => 
        score.user.toString() === student._id.toString()
      )

      // Calculate statistics
      let totalScore = 0
      let totalMaxScore = 0
      studentScores.forEach(score => {
        totalScore += score.score
        totalMaxScore += score.maxScore
      })

      // Get most recent score
      const recentScore = studentScores.length > 0
        ? studentScores.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null

      return {
        id: student._id,
        name: student.name || 'Unnamed Student',
        email: student.email,
        enrolledClasses: enrolledClasses.map(cls => ({
          id: cls._id,
          name: cls.name
        })),
        quizStats: {
          totalAttempts: studentScores.length,
          averageScore: totalMaxScore > 0
            ? Math.round((totalScore / totalMaxScore) * 100)
            : 0,
          recentScore: recentScore ? {
            score: recentScore.score,
            maxScore: recentScore.maxScore,
            quizTitle: recentScore.quiz.title,
            createdAt: recentScore.createdAt
          } : null
        }
      }
    }))

    return NextResponse.json(processedStudents)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { message: 'Failed to fetch students' },
      { status: 500 }
    )
  }
} 