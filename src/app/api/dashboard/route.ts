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

interface PopulatedClass {
  _id: Types.ObjectId;
  students: Array<{ _id: Types.ObjectId }>;
  teacher: PopulatedUser;
  name: string;
  __v: number;
}

interface PopulatedScore {
  _id: Types.ObjectId;
  user: PopulatedUser;
  quiz: {
    _id: Types.ObjectId;
    title: string;
    class: {
      name: string;
    };
  };
  score: number;
  maxScore: number;
  createdAt: Date;
}

interface PopulatedQuiz {
  _id: Types.ObjectId;
  scores?: Array<{
    _id: Types.ObjectId;
    user: PopulatedUser;
    score: number;
    maxScore: number;
  }>;
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

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const isTeacher = user.role === 'TEACHER'

    // Get classes
    const classes = await Class.find(
      isTeacher
        ? { teacher: user._id }
        : { students: user._id }
    )
    .populate('teacher', 'name email')
    .lean() as PopulatedClass[]

    // Get total students if teacher
    let totalStudents = 0
    if (isTeacher) {
      const uniqueStudentIds = new Set<string>()
      for (const cls of classes) {
        const classWithStudents = await Class.findById(cls._id)
          .populate('students', '_id')
          .lean() as PopulatedClass | null

        if (classWithStudents?.students) {
          classWithStudents.students.forEach(student => {
            uniqueStudentIds.add(student._id.toString())
          })
        }
      }
      totalStudents = uniqueStudentIds.size
    }

    // Get quizzes
    const classIds = classes.map(c => c._id)
    const quizzes = await Quiz.find({ class: { $in: classIds } })
      .populate({
        path: 'scores',
        match: isTeacher ? {} : { user: user._id },
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .lean() as PopulatedQuiz[]

    // Calculate statistics
    const stats = {
      totalStudents,
      totalClasses: classes.length,
      totalQuizzes: quizzes.length,
      averageScore: 0,
      recentActivity: [],
    }

    // Calculate average score
    let totalScore = 0
    let totalMaxScore = 0
    let attemptCount = 0

    quizzes.forEach(quiz => {
      quiz.scores?.forEach(score => {
        totalScore += score.score
        totalMaxScore += score.maxScore
        attemptCount++
      })
    })

    stats.averageScore = totalMaxScore > 0
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0

    // Get recent activity
    const recentScoresQuery = await Score.find(
      isTeacher
        ? { quiz: { $in: quizzes.map(q => q._id) } }
        : { user: user._id, quiz: { $in: quizzes.map(q => q._id) } }
    )
    .populate('user', 'name email')
    .populate({
      path: 'quiz',
      select: 'title class',
      populate: {
        path: 'class',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean()

    // Type assertion after verifying the shape
    const recentScores = recentScoresQuery.map(score => ({
      _id: score._id as Types.ObjectId,
      user: {
        _id: score.user._id as Types.ObjectId,
        name: score.user.name,
        email: score.user.email,
      },
      quiz: {
        _id: score.quiz._id as Types.ObjectId,
        title: score.quiz.title,
        class: {
          name: score.quiz.class.name,
        },
      },
      score: score.score,
      maxScore: score.maxScore,
      createdAt: score.createdAt,
    })) as PopulatedScore[]

    const recentActivity = recentScores.map(score => ({
      type: 'quiz_attempt',
      studentName: score.user.name || score.user.email,
      quizTitle: score.quiz.title,
      className: score.quiz.class.name,
      score: score.score,
      maxScore: score.maxScore,
      createdAt: score.createdAt,
    }))

    return NextResponse.json({
      stats: {
        ...stats,
        recentActivity,
      }
    })
  } catch (error) {
    console.error('Error in dashboard route:', error)
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
} 