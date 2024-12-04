import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Get student details with all related data
    const student = await prisma.user.findFirst({
      where: {
        id: params.id,
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
            quizzes: {
              select: {
                id: true,
                scores: {
                  where: {
                    userId: params.id,
                  },
                  select: {
                    score: true,
                    maxScore: true,
                  },
                },
              },
            },
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
            id: true,
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

    if (!student) {
      return NextResponse.json(
        { message: 'Student not found' },
        { status: 404 }
      )
    }

    // Process and format student data
    const quizAttempts = student.quizAttempts.map(attempt => ({
      id: attempt.id,
      quizTitle: attempt.quiz.title,
      className: attempt.quiz.class.name,
      score: attempt.score,
      maxScore: attempt.maxScore,
      createdAt: attempt.createdAt.toISOString(),
    }))

    // Calculate class performance
    const enrolledClasses = student.classesJoined.map(classData => {
      const classAttempts = classData.quizzes.flatMap(quiz => quiz.scores)
      const totalScore = classAttempts.reduce((sum, s) => sum + s.score, 0)
      const totalMaxScore = classAttempts.reduce((sum, s) => sum + s.maxScore, 0)
      
      return {
        id: classData.id,
        name: classData.name,
        averageScore: totalMaxScore > 0
          ? Math.round((totalScore / totalMaxScore) * 100)
          : 0,
        completedQuizzes: classAttempts.length,
        totalQuizzes: classData.quizzes.length,
      }
    })

    // Calculate overall statistics
    const allAttempts = student.quizAttempts
    const totalScore = allAttempts.reduce((sum, a) => sum + a.score, 0)
    const totalMaxScore = allAttempts.reduce((sum, a) => sum + a.maxScore, 0)
    const scores = allAttempts.map(a => Math.round((a.score / a.maxScore) * 100))

    const stats = {
      totalAttempts: allAttempts.length,
      averageScore: totalMaxScore > 0
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      worstScore: scores.length > 0 ? Math.min(...scores) : 0,
    }

    return NextResponse.json({
      id: student.id,
      name: student.name || 'Unnamed Student',
      email: student.email,
      enrolledClasses,
      quizAttempts,
      stats,
    })
  } catch (error) {
    console.error('Error in student details API:', error)
    return NextResponse.json(
      { message: 'Failed to fetch student details. Please try again.' },
      { status: 500 }
    )
  }
} 