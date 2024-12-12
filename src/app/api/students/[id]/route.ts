import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz from '@/models/Quiz'
import Score from '@/models/Score'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
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

    // Get student details
    const student = await User.findById(params.id).lean()

    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      )
    }

    // Get all classes where this student is enrolled
    const enrolledClasses = await Class.find({
      students: student._id
    }).lean()

    // Get all quizzes for these classes
    const quizzes = await Quiz.find({
      class: { $in: enrolledClasses.map(c => c._id) }
    }).lean()

    // Get all scores for this student
    const scores = await Score.find({ user: student._id })
      .populate({
        path: 'quiz',
        select: 'title class',
        populate: {
          path: 'class',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .lean()

    // Calculate overall statistics
    const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
    const totalMaxScore = scores.reduce((sum, score) => sum + score.maxScore, 0)
    const averageScore = totalMaxScore > 0
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0

    // Calculate best and worst scores
    const scorePercentages = scores.map(score => 
      Math.round((score.score / score.maxScore) * 100)
    )
    const bestScore = scorePercentages.length > 0 ? Math.max(...scorePercentages) : 0
    const worstScore = scorePercentages.length > 0 ? Math.min(...scorePercentages) : 0

    // Process class performance
    const classPerformance = enrolledClasses.map(cls => {
      const classQuizzes = quizzes.filter(q => q.class.toString() === cls._id.toString())
      const classScores = scores.filter(score => 
        score.quiz.class._id.toString() === cls._id.toString()
      )
      
      const classTotalScore = classScores.reduce((sum, score) => sum + score.score, 0)
      const classMaxScore = classScores.reduce((sum, score) => sum + score.maxScore, 0)
      
      return {
        id: cls._id,
        name: cls.name,
        averageScore: classMaxScore > 0
          ? Math.round((classTotalScore / classMaxScore) * 100)
          : 0,
        completedQuizzes: classScores.length,
        totalQuizzes: classQuizzes.length
      }
    })

    // Format quiz attempts
    const quizAttempts = scores.map(score => ({
      id: score._id,
      quizTitle: score.quiz.title,
      className: score.quiz.class.name,
      score: score.score,
      maxScore: score.maxScore,
      createdAt: score.createdAt
    }))

    return NextResponse.json({
      id: student._id,
      name: student.name || 'Unnamed Student',
      email: student.email,
      enrolledClasses: classPerformance,
      quizAttempts,
      stats: {
        totalAttempts: scores.length,
        averageScore,
        bestScore,
        worstScore
      }
    })
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { message: 'Failed to fetch student details' },
      { status: 500 }
    )
  }
} 