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
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
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

    return NextResponse.json(classAccess)
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 