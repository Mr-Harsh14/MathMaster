import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class, { IClass } from '@/models/Class'
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

    // Get total students
    const totalStudents = await User.countDocuments({ role: 'STUDENT' })

    // Get teacher's classes with their quizzes and scores
    const classes = await Class.find({ teacher: user._id })
      .populate({
        path: 'students',
      })
      .lean() as (IClass & { _id: string })[]

    // Get all quizzes for these classes
    const classIds = classes.map(c => c._id)
    const quizzes = await Quiz.find({ class: { $in: classIds } })
      .populate({
        path: 'scores',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .lean()

    // Calculate statistics
    const totalQuizzes = quizzes.length
    const totalAttempts = quizzes.reduce((sum, quiz) => sum + (quiz.scores?.length || 0), 0)

    // Calculate average score
    let totalScore = 0
    let totalMaxScore = 0
    quizzes.forEach(quiz => {
      quiz.scores?.forEach((score: any) => {
        totalScore += score.score
        totalMaxScore += score.maxScore
      })
    })
    const averageScore = totalMaxScore > 0
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0

    // Calculate class performance
    const classPerformance = await Promise.all(classes.map(async (c) => {
      const classQuizzes = quizzes.filter(q => q.class.toString() === c._id.toString())
      let classScore = 0
      let classMaxScore = 0
      classQuizzes.forEach(quiz => {
        quiz.scores?.forEach((score: any) => {
          classScore += score.score
          classMaxScore += score.maxScore
        })
      })

      return {
        className: c.name,
        averageScore: classMaxScore > 0
          ? Math.round((classScore / classMaxScore) * 100)
          : 0,
        totalStudents: c.students?.length || 0,
        totalQuizzes: classQuizzes.length,
      }
    }))

    // Get recent scores
    const recentScores = await Score.find({
      quiz: { $in: quizzes.map(q => q._id) }
    })
    .populate('user', 'name email')
    .populate({
      path: 'quiz',
      select: 'title',
      populate: {
        path: 'class',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

    return NextResponse.json({
      totalStudents,
      totalQuizzes,
      totalAttempts,
      averageScore,
      classPerformance,
      recentScores: recentScores.map(score => ({
        studentName: score.user.name || score.user.email,
        quizTitle: score.quiz.title,
        score: score.score,
        maxScore: score.maxScore,
        createdAt: score.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 