import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if user has access to this class and get class data
    const classAccess = await prisma.class.findFirst({
      where: {
        id: params.id,
        OR: [
          { teacherId: user.id },
          { students: { some: { id: user.id } } },
        ],
      },
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            _count: {
              select: {
                questions: true,
                scores: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            students: true,
            quizzes: true,
          },
        },
      },
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Get recent quiz attempts
    const recentAttempts = await prisma.score.findMany({
      where: {
        quiz: {
          classId: params.id,
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
      take: 5,
    })

    // Format the response
    const response = {
      ...classAccess,
      recentActivity: {
        students: classAccess.students.map(student => ({
          id: student.id,
          name: student.name,
          email: user.role === 'TEACHER' ? student.email : undefined,
        })),
        quizzes: classAccess.quizzes,
        attempts: recentAttempts.map(attempt => ({
          id: attempt.id,
          studentName: attempt.user.name,
          studentEmail: user.role === 'TEACHER' ? attempt.user.email : undefined,
          quizTitle: attempt.quiz.title,
          score: attempt.score,
          maxScore: attempt.maxScore,
          createdAt: attempt.createdAt,
        })),
      },
      // Remove the raw data from the response
      students: undefined,
      quizzes: undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 