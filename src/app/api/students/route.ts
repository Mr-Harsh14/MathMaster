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

    // Get all students in teacher's classes with detailed information
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        classesJoined: {
          some: {
            teacherId: user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        classesJoined: {
          where: {
            teacherId: user.id,
          },
          select: {
            id: true,
            name: true,
          },
        },
        quizAttempts: {
          where: {
            quiz: {
              class: {
                teacherId: user.id,
              },
            },
          },
          select: {
            score: true,
            maxScore: true,
            createdAt: true,
            quiz: {
              select: {
                id: true,
                title: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Process and format student data
    const formattedStudents = students.map(student => {
      // Calculate quiz statistics
      const attempts = student.quizAttempts
      const totalScore = attempts.reduce((sum, a) => sum + a.score, 0)
      const totalMaxScore = attempts.reduce((sum, a) => sum + a.maxScore, 0)
      const averageScore = totalMaxScore > 0
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0

      // Get most recent quiz attempt
      const recentAttempt = attempts[0]
      const recentScore = recentAttempt ? {
        score: recentAttempt.score,
        maxScore: recentAttempt.maxScore,
        quizTitle: recentAttempt.quiz.title,
        createdAt: recentAttempt.createdAt.toISOString(),
      } : null

      return {
        id: student.id,
        name: student.name || 'Unnamed Student',
        email: student.email,
        enrolledClasses: student.classesJoined.map(c => ({
          id: c.id,
          name: c.name,
        })),
        quizStats: {
          totalAttempts: attempts.length,
          averageScore,
          recentScore,
        },
      }
    })

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('Error in students API:', error)
    return NextResponse.json(
      { message: 'Failed to fetch students. Please try again.' },
      { status: 500 }
    )
  }
} 