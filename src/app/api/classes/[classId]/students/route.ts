import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Quiz from '@/models/Quiz'
import Score from '@/models/Score'

export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
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

    // Get class with populated students
    const classDoc = await Class.findById(params.classId)
      .populate('students', 'name email')
      .lean()

    if (!classDoc) {
      return NextResponse.json(
        { message: 'Class not found' },
        { status: 404 }
      )
    }

    // Get all quizzes for this class
    const quizzes = await Quiz.find({ class: params.classId }).lean()
    const quizIds = quizzes.map(quiz => quiz._id)

    // Get all scores for quizzes in this class
    const scores = await Score.find({
      quiz: { $in: quizIds },
      user: { $in: classDoc.students.map(s => s._id) }
    }).lean()

    // Process student data
    const students = classDoc.students.map(student => {
      const studentScores = scores.filter(score => 
        score.user.toString() === student._id.toString()
      )

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        quizScores: studentScores.map(score => ({
          score: score.score,
          maxScore: score.maxScore
        }))
      }
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { message: 'Failed to fetch students' },
      { status: 500 }
    )
  }
} 