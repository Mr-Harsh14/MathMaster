import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz, { IQuiz } from '@/models/Quiz'
import Score from '@/models/Score'
import { Types } from 'mongoose'

interface RouteParams {
  params: {
    id: string
    quizId: string
  }
}

// Define the shape of a question in the lean document
interface QuestionDoc {
  _id: Types.ObjectId;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// Define the shape of the lean document returned by .lean()
interface LeanQuizDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  class: Types.ObjectId;
  questions: QuestionDoc[];
  timeLimit?: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check class access
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
        { status: 403 }
      )
    }

    // Get quiz details
    const quiz = await Quiz.findOne({
      _id: params.quizId,
      class: params.id
    })
    .lean() as LeanQuizDocument | null

    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      )
    }

    // For students, check if they've already taken the quiz
    if (user.role === 'STUDENT') {
      const existingScore = await Score.findOne({
        quiz: quiz._id,
        user: user._id
      }).lean()

      if (existingScore) {
        // Return quiz with student's previous attempt data
        const correctAnswers = quiz.questions.map(q => q.answer)
        const explanations = quiz.questions.map(q => q.explanation || null)
        
        return NextResponse.json({
          ...quiz,
          alreadyTaken: true,
          score: existingScore.score,
          maxScore: existingScore.maxScore,
          selectedAnswers: existingScore.answers,
          correctAnswers,
          explanations,
        })
      }

      // Remove answers for students who haven't taken the quiz
      const quizForStudent = {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          answer: undefined,
          explanation: undefined,
        })),
        alreadyTaken: false,
      }

      return NextResponse.json(quizForStudent)
    }

    // For teachers, return full quiz details
    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Check class access
    const classAccess = await Class.findOne({
      _id: params.id,
      students: user._id
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 403 }
      )
    }

    // Get quiz and verify it exists
    const quiz = await Quiz.findOne({
      _id: params.quizId,
      class: params.id
    }).lean() as LeanQuizDocument | null

    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if student has already taken this quiz
    const existingScore = await Score.findOne({
      quiz: quiz._id,
      user: user._id
    })

    if (existingScore) {
      return NextResponse.json(
        { message: 'Quiz already taken' },
        { status: 400 }
      )
    }

    // Get student answers from request body
    const { answers } = await request.json()

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { message: 'Invalid answers format' },
        { status: 400 }
      )
    }

    // Calculate score
    let score = 0
    const maxScore = quiz.questions.length
    const correctAnswers = quiz.questions.map(q => q.answer)
    const explanations = quiz.questions.map(q => q.explanation || null)

    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        score++
      }
    })

    // Create score record
    const newScore = await Score.create({
      quiz: quiz._id,
      user: user._id,
      score,
      maxScore,
      answers
    })

    return NextResponse.json({
      score,
      maxScore,
      correctAnswers,
      explanations,
      scoreId: newScore._id
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { message: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Check class ownership
    const classData = await Class.findOne({
      _id: params.id,
      teacher: user._id
    })

    if (!classData) {
      return NextResponse.json(
        { message: 'Class not found or not authorized' },
        { status: 403 }
      )
    }

    // Get quiz and verify ownership
    const quiz = await Quiz.findOne({
      _id: params.quizId,
      class: params.id
    })

    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Delete scores first
    await Score.deleteMany({ quiz: quiz._id })

    // Then delete the quiz
    await Quiz.deleteOne({ _id: quiz._id })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json(
      { message: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Check class ownership
    const classData = await Class.findOne({
      _id: params.id,
      teacher: user._id
    })

    if (!classData) {
      return NextResponse.json(
        { message: 'Class not found or not authorized' },
        { status: 403 }
      )
    }

    // Get quiz and verify ownership
    const quiz = await Quiz.findOne({
      _id: params.quizId,
      class: params.id
    })

    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      )
    }

    const { questions } = await request.json()

    // Validate questions
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { message: 'Invalid questions format' },
        { status: 400 }
      )
    }

    for (const question of questions) {
      if (!question.question || !Array.isArray(question.options) || !question.answer) {
        return NextResponse.json(
          { message: 'Each question must have a question text, options array, and an answer' },
          { status: 400 }
        )
      }

      if (question.options.length < 2) {
        return NextResponse.json(
          { message: 'Each question must have at least 2 options' },
          { status: 400 }
        )
      }

      if (!question.options.includes(question.answer)) {
        return NextResponse.json(
          { message: 'The answer must be one of the options' },
          { status: 400 }
        )
      }
    }

    // Update quiz with new questions
    quiz.questions = questions
    await quiz.save()

    return NextResponse.json({
      message: 'Questions updated successfully',
      questions: quiz.questions
    })
  } catch (error) {
    console.error('Error updating quiz questions:', error)
    return NextResponse.json(
      { message: 'Failed to update quiz questions' },
      { status: 500 }
    )
  }
} 