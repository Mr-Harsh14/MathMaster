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

    // Get all students in teacher's classes
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
                class: {
                  select: {
                    teacherId: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Process and format student data
    const formattedStudents = students.map(student => {
      // Filter quiz attempts to only include quizzes from teacher's classes
      const validAttempts = student.quizAttempts.filter(
        attempt => attempt.quiz.class.teacherId === user.id
      )

      // Calculate quiz statistics
      const totalScore = validAttempts.reduce((sum, a) => sum + a.score, 0)
      const totalMaxScore = validAttempts.reduce((sum, a) => sum + a.maxScore, 0)
      const averageScore = totalMaxScore > 0
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        enrolledClasses: student.classesJoined,
        quizStats: {
          totalAttempts: validAttempts.length,
          averageScore,
          recentScore: validAttempts[0] ? {
            score: validAttempts[0].score,
            maxScore: validAttempts[0].maxScore,
            quizTitle: validAttempts[0].quiz.title,
            createdAt: validAttempts[0].createdAt,
          } : null,
        },
      }
    })

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 