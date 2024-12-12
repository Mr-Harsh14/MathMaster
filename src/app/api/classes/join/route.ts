import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'

export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

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

    const classToJoin = await Class.findOne({ code })
      .populate('teacher', 'name email')

    if (!classToJoin) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if student is already enrolled
    if (classToJoin.students.includes(user._id)) {
      return NextResponse.json(
        { message: 'You are already enrolled in this class' },
        { status: 400 }
      )
    }

    // Add student to class
    classToJoin.students.push(user._id)
    await classToJoin.save()

    // Format response
    const formattedClass = {
      id: classToJoin._id,
      name: classToJoin.name,
      code: classToJoin.code,
      teacher: {
        name: classToJoin.teacher.name,
        email: classToJoin.teacher.email,
      },
      _count: {
        students: classToJoin.students.length,
        quizzes: classToJoin.quizzes || 0,
      },
    }

    return NextResponse.json(formattedClass)
  } catch (error) {
    console.error('Error joining class:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 