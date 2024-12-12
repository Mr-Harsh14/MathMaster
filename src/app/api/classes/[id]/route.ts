import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class, { IClass } from '@/models/Class'
import Quiz, { IQuiz } from '@/models/Quiz'
import Score from '@/models/Score'
import { Types } from 'mongoose'

interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  email: string;
}

interface QuestionDoc {
  _id: Types.ObjectId;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// Define the shape of a populated score in a quiz
interface PopulatedScore {
  _id: Types.ObjectId;
  user: PopulatedUser;
  score: number;
  maxScore: number;
  createdAt: Date;
}

// Define the shape of a quiz document after population and lean
interface PopulatedQuizDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  class: Types.ObjectId;
  questions: QuestionDoc[];
  timeLimit?: number;
  scores?: PopulatedScore[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Define the shape of a score document after population and lean
interface PopulatedScoreDocument {
  _id: Types.ObjectId;
  user: PopulatedUser;
  quiz: {
    _id: Types.ObjectId;
    title: string;
  };
  score: number;
  maxScore: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Define the shape of a class document after population and lean
interface PopulatedClassDocument {
  _id: Types.ObjectId;
  name: string;
  code: string;
  teacher: PopulatedUser;
  students: PopulatedUser[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user has access to this class
    const classData = await Class.findOne({
      _id: params.id,
      $or: [
        { teacher: user._id },
        { students: user._id }
      ]
    })
    .populate('teacher', 'name email')
    .populate('students', 'name email')
    .lean() as PopulatedClassDocument

    if (!classData) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Get quizzes for this class
    const quizzes = await Quiz.find({ class: params.id })
      .populate({
        path: 'scores',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .lean()
      .then(docs => docs as PopulatedQuizDocument[])

    // Get recent activity (quiz attempts)
    const recentScores = await Score.find({
      quiz: { $in: quizzes.map(q => q._id) }
    })
    .populate('user', 'name email')
    .populate({
      path: 'quiz',
      select: 'title'
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()
    .then(docs => docs as PopulatedScoreDocument[])

    // Calculate class statistics
    let totalScore = 0
    let totalMaxScore = 0
    let totalAttempts = 0

    quizzes.forEach(quiz => {
      quiz.scores?.forEach(score => {
        totalScore += score.score
        totalMaxScore += score.maxScore
        totalAttempts++
      })
    })

    // Format the response
    const formattedClass = {
      id: classData._id,
      name: classData.name,
      code: classData.code,
      teacher: {
        name: classData.teacher.name,
        email: classData.teacher.email,
      },
      students: classData.students.map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
      })),
      stats: {
        totalStudents: classData.students.length,
        totalQuizzes: quizzes.length,
        averageScore: totalMaxScore > 0
          ? Math.round((totalScore / totalMaxScore) * 100)
          : 0,
      },
      recentActivity: {
        attempts: recentScores.map(score => ({
          studentName: score.user.name || score.user.email,
          quizTitle: score.quiz.title,
          score: score.score,
          maxScore: score.maxScore,
          createdAt: score.createdAt,
        })),
      },
      quizzes: quizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        questions: quiz.questions.map(q => ({
          ...q,
          answer: user.role === 'TEACHER' ? q.answer : undefined,
          explanation: q.explanation,
        })),
        scores: quiz.scores?.map(score => ({
          studentName: score.user.name || score.user.email,
          score: score.score,
          maxScore: score.maxScore,
          createdAt: score.createdAt,
        })),
      })),
    }

    return NextResponse.json(formattedClass)
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json(
      { message: 'Failed to fetch class details' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if class exists and belongs to the teacher
    const classToDelete = await Class.findOne({
      _id: params.id,
      teacher: user._id
    })

    if (!classToDelete) {
      return NextResponse.json(
        { message: 'Class not found or not authorized to delete' },
        { status: 404 }
      )
    }

    // Delete all related quizzes and scores
    const quizzes = await Quiz.find({ class: params.id })
    for (const quiz of quizzes) {
      await Score.deleteMany({ quiz: quiz._id })
    }
    await Quiz.deleteMany({ class: params.id })

    // Delete the class
    await Class.deleteOne({ _id: params.id })

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json(
      { message: 'Failed to delete class' },
      { status: 500 }
    )
  }
} 