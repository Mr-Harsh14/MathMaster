import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get total students
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' },
    })

    // Get teacher's classes with their quizzes and scores
    const classes = await prisma.class.findMany({
      where: { teacherId: user.id },
      include: {
        students: true,
        quizzes: {
          include: {
            scores: true,
          },
        },
      },
    })

    // Calculate total quizzes and attempts
    const totalQuizzes = classes.reduce((sum, c) => sum + c.quizzes.length, 0)
    const totalAttempts = classes.reduce(
      (sum, c) => sum + c.quizzes.reduce((s, q) => s + q.scores.length, 0),
      0
    )

    // Calculate average score across all quizzes
    let totalScore = 0
    let totalMaxScore = 0
    classes.forEach(c => {
      c.quizzes.forEach(q => {
        q.scores.forEach(s => {
          totalScore += s.score
          totalMaxScore += s.maxScore
        })
      })
    })
    const averageScore = totalMaxScore > 0
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0

    // Calculate class performance
    const classPerformance = classes.map(c => {
      let classScore = 0
      let classMaxScore = 0
      c.quizzes.forEach(q => {
        q.scores.forEach(s => {
          classScore += s.score
          classMaxScore += s.maxScore
        })
      })

      return {
        className: c.name,
        averageScore: classMaxScore > 0
          ? Math.round((classScore / classMaxScore) * 100)
          : 0,
        totalStudents: c.students.length,
        totalQuizzes: c.quizzes.length,
      }
    })

    // Get recent scores
    const recentScores = await prisma.score.findMany({
      where: {
        quiz: {
          class: {
            teacherId: user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

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