import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz from '@/models/Quiz'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user has access to this class
    const classAccess = await Class.findOne({
      _id: params.id,
      $or: [
        { teacher: user._id },
        { students: user._id }
      ]
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Get quizzes
    const quizzes = await Quiz.find({ class: params.id })
      .populate({
        path: 'scores',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .lean()

    // Format quizzes
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz._id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map(q => ({
        id: q._id,
        question: q.question,
        options: q.options,
        answer: user.role === 'TEACHER' ? q.answer : undefined,
        explanation: q.explanation,
      })),
      _count: {
        questions: quiz.questions.length,
        attempts: quiz.scores?.length || 0,
      },
    }))

    return NextResponse.json(formattedQuizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Only teachers can create quizzes' },
        { status: 403 }
      )
    }

    // Check if class exists and user is the teacher
    const classData = await Class.findOne({
      _id: params.id,
      teacher: user._id
    })

    if (!classData) {
      return NextResponse.json(
        { message: 'Class not found or not authorized' },
        { status: 404 }
      )
    }

    const { title, description, timeLimit } = await req.json()

    // Validate input
    if (!title) {
      return NextResponse.json(
        { message: 'Quiz title is required' },
        { status: 400 }
      )
    }

    // Create quiz
    const quiz = await Quiz.create({
      title,
      description,
      class: params.id,
      questions: [],
      timeLimit: timeLimit ? parseInt(timeLimit) : null,
    })

    // Format response
    const formattedQuiz = {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      questions: [],
      _count: {
        questions: 0,
        scores: 0,
      },
    }

    return NextResponse.json(formattedQuiz, { status: 201 })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { message: 'Failed to create quiz' },
      { status: 500 }
    )
  }
} 