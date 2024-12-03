import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get the timeframe from query parameters
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || 'all'

    // Calculate the start date based on timeframe
    const startDate = new Date()
    if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    // Get all students with their scores
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        quizAttempts: timeframe !== 'all' ? {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        quizAttempts: {
          where: timeframe !== 'all' ? {
            createdAt: {
              gte: startDate,
            },
          } : undefined,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            score: true,
            maxScore: true,
            createdAt: true,
            quiz: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    // Calculate statistics for each student
    const leaderboard = students
      .map(student => {
        const scores = student.quizAttempts
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
        const totalMaxScore = scores.reduce((sum, s) => sum + s.maxScore, 0)
        const averageScore = totalMaxScore > 0
          ? Math.round((totalScore / totalMaxScore) * 100)
          : 0

        return {
          userId: student.id,
          studentName: student.name || student.email,
          totalScore,
          totalMaxScore,
          averageScore,
          quizzesTaken: scores.length,
          recentScores: scores.map(score => ({
            quizTitle: score.quiz.title,
            score: score.score,
            maxScore: score.maxScore,
            createdAt: score.createdAt,
          })),
        }
      })
      // Filter out students with no attempts
      .filter(student => student.quizzesTaken > 0)
      // Sort by average score (desc) and total score (desc)
      .sort((a, b) => {
        if (a.averageScore !== b.averageScore) {
          return b.averageScore - a.averageScore
        }
        return b.totalScore - a.totalScore
      })

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 