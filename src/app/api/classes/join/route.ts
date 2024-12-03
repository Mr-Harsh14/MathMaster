import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (user.role !== 'STUDENT') {
      return NextResponse.json(
        { message: 'Only students can join classes' },
        { status: 403 }
      )
    }

    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { message: 'Class code is required' },
        { status: 400 }
      )
    }

    const classToJoin = await prisma.class.findUnique({
      where: { code },
      include: {
        students: {
          where: { id: user.id },
        },
      },
    })

    if (!classToJoin) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      )
    }

    if (classToJoin.students.length > 0) {
      return NextResponse.json(
        { message: 'You are already enrolled in this class' },
        { status: 400 }
      )
    }

    const updatedClass = await prisma.class.update({
      where: { id: classToJoin.id },
      data: {
        students: {
          connect: { id: user.id },
        },
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

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error('Error joining class:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 