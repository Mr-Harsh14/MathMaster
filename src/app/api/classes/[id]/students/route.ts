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

    // Check if user has access to this class
    const classAccess = await prisma.class.findFirst({
      where: {
        id: params.id,
        OR: [
          { teacherId: user.id },
          { students: { some: { id: user.id } } },
        ],
      },
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Get students with their quiz scores
    const students = await prisma.user.findMany({
      where: {
        classesJoined: { some: { id: params.id } },
      },
      select: {
        id: true,
        name: true,
        email: user.role === 'TEACHER',
        quizAttempts: {
          where: {
            quiz: {
              classId: params.id,
            },
          },
          select: {
            score: true,
            maxScore: true,
          },
        },
      },
    })

    // Transform the data to match the expected format
    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email || '',
      quizScores: student.quizAttempts,
    }))

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 