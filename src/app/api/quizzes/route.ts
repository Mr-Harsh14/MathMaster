import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz from '@/models/Quiz'
import Score from '@/models/Score'
import { Types } from 'mongoose'

interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  email: string;
}

interface QuizScore {
  _id: Types.ObjectId;
  user: PopulatedUser;
  score: number;
  maxScore: number;
  createdAt: Date;
}

interface PopulatedQuiz {
  _id: Types.ObjectId;
  title: string;
  class: {
    _id: Types.ObjectId;
    name: string;
  };
  questions: Array<{
    _id: Types.ObjectId;
    question: string;
    options: string[];
    answer: string;
  }>;
  scores?: QuizScore[];
  createdAt: Date;
}

interface MongoDBQuiz {
  _id: Types.ObjectId;
  title: string;
  class: {
    _id: Types.ObjectId;
    name: string;
  };
  questions: Array<{
    _id: Types.ObjectId;
    question: string;
    options: string[];
    answer: string;
  }>;
  scores?: Array<{
    _id: Types.ObjectId;
    user: {
      _id: Types.ObjectId;
      name?: string;
      email: string;
    };
    score: number;
    maxScore: number;
    createdAt: Date;
  }>;
  createdAt: Date;
  __v: number;
}

export async function GET() {
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

    // Get all quizzes from classes where user is the teacher
    const teacherClasses = await Class.find({ teacher: user._id })
    const classIds = teacherClasses.map(c => c._id)

    const rawQuizzes = await Quiz.find({ class: { $in: classIds } })
      .populate('class', 'name')
      .populate({
        path: 'scores',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .lean()

    const quizzes = (rawQuizzes as MongoDBQuiz[]).map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      class: {
        _id: quiz.class._id,
        name: quiz.class.name
      },
      questions: quiz.questions,
      scores: quiz.scores,
      createdAt: quiz.createdAt
    })) as PopulatedQuiz[]

    // Process quiz data
    const processedQuizzes = quizzes.map(quiz => {
      const attempts = quiz.scores || []
      const totalScore = attempts.reduce((sum: number, score) => sum + score.score, 0)
      const totalMaxScore = attempts.reduce((sum: number, score) => sum + score.maxScore, 0)
      const averageScore = totalMaxScore > 0
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0

      // Get most recent attempt
      const recentAttempt = attempts.length > 0
        ? attempts.reduce((latest: QuizScore, current: QuizScore) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null

      return {
        id: quiz._id,
        title: quiz.title,
        className: quiz.class.name,
        classId: quiz.class._id,
        createdAt: quiz.createdAt,
        stats: {
          totalQuestions: quiz.questions.length,
          totalAttempts: attempts.length,
          averageScore,
          recentAttempt: recentAttempt ? {
            studentName: recentAttempt.user.name || recentAttempt.user.email,
            score: recentAttempt.score,
            maxScore: recentAttempt.maxScore,
            createdAt: recentAttempt.createdAt
          } : null
        }
      }
    })

    return NextResponse.json(processedQuizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
} 