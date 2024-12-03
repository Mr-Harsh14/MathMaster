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

    // Get all quizzes from teacher's classes
    const quizzes = await prisma.quiz.findMany({
      where: {
        class: {
          teacherId: user.id,
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        classId: true,
        class: {
          select: {
            name: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
        scores: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            score: true,
            maxScore: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Process and format quiz data
    const formattedQuizzes = quizzes.map(quiz => {
      // Calculate quiz statistics
      const totalScore = quiz.scores.reduce((sum, s) => sum + s.score, 0)
      const totalMaxScore = quiz.scores.reduce((sum, s) => sum + s.maxScore, 0)
      const averageScore = totalMaxScore > 0
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0

      return {
        id: quiz.id,
        title: quiz.title,
        className: quiz.class.name,
        classId: quiz.classId,
        createdAt: quiz.createdAt,
        stats: {
          totalQuestions: quiz.questions.length,
          totalAttempts: quiz.scores.length,
          averageScore,
          recentAttempt: quiz.scores[0] ? {
            studentName: quiz.scores[0].user.name || quiz.scores[0].user.email,
            score: quiz.scores[0].score,
            maxScore: quiz.scores[0].maxScore,
            createdAt: quiz.scores[0].createdAt,
          } : null,
        },
      }
    })

    return NextResponse.json(formattedQuizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 