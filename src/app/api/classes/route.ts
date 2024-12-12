import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
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

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json(
        { message: 'User account not found' },
        { status: 404 }
      )
    }

    // Determine if the user is a teacher
    const isTeacher = user.role === 'TEACHER'

    // Get classes based on user role
    const classes = await Class.find(
      isTeacher
        ? { teacher: user._id }
        : { students: user._id }
    )
    .populate('teacher', 'name email')
    .lean()

    // Transform the data to match the expected format
    const formattedClasses = classes.map(cls => ({
      id: cls._id,
      name: cls.name,
      code: cls.code,
      teacher: {
        name: cls.teacher.name,
        email: cls.teacher.email,
      },
      _count: {
        students: cls.students?.length || 0,
        quizzes: cls.quizzes || 0,
      },
    }))

    return NextResponse.json(formattedClasses)
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

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

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

    const newClass = await Class.create({
      name: name.trim(),
      code: classCode,
      teacher: user._id,
      students: [],
    })

    // Populate teacher information
    await newClass.populate('teacher', 'name email')

    // Format the response
    const formattedClass = {
      id: newClass._id,
      name: newClass.name,
      code: newClass.code,
      teacher: {
        name: newClass.teacher.name,
        email: newClass.teacher.email,
      },
      _count: {
        students: 0,
        quizzes: 0,
      },
    }

    return NextResponse.json(formattedClass, { status: 201 })
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json(
      { message: 'Failed to create class. Please try again.' },
      { status: 500 }
    )
  }
} 