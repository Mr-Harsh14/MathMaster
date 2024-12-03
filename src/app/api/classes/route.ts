import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// GET /api/classes - Get all classes for the current user
export async function GET() {
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

    const classes = await prisma.class.findMany({
      where: user.role === 'TEACHER' 
        ? { teacherId: user.id }
        : { students: { some: { id: user.id } } },
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

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/classes - Create a new class
export async function POST(req: Request) {
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

    if (user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Only teachers can create classes' },
        { status: 403 }
      )
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json(
        { message: 'Class name is required' },
        { status: 400 }
      )
    }

    const classCode = nanoid(6).toUpperCase()

    const newClass = await prisma.class.create({
      data: {
        name,
        code: classCode,
        teacherId: user.id,
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

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 