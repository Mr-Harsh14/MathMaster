import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// GET /api/classes - Get all classes for the current user
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Please sign in to view your classes' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User account not found' },
        { status: 404 }
      )
    }

    // Determine if the user is a teacher
    const isTeacher = user.role === 'TEACHER'

    // Get classes based on user role
    const classes = await prisma.class.findMany({
      where: isTeacher
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
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Return empty array if no classes found
    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { message: 'Failed to fetch classes. Please try again.' },
      { status: 500 }
    )
  }
}

// POST /api/classes - Create a new class
export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Please sign in to create a class' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User account not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Only teachers can create classes' },
        { status: 403 }
      )
    }

    const { name } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: 'Please provide a valid class name' },
        { status: 400 }
      )
    }

    // Generate a unique class code
    const classCode = nanoid(6).toUpperCase()

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
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
      { message: 'Failed to create class. Please try again.' },
      { status: 500 }
    )
  }
} 