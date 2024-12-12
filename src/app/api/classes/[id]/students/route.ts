import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Class from '@/models/Class'
import Score from '@/models/Score'
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

    // Get students with their quiz scores
    const students = await User.find({
      _id: { $in: classAccess.students }
    })
    .select('id name email')
    .lean()

    // Get scores for each student
    const studentsWithScores = await Promise.all(
      students.map(async (student) => {
        const scores = await Score.find({
          user: student._id,
          quiz: { $in: await Quiz.find({ class: params.id }).select('_id') }
        })
        .select('score maxScore')
        .lean()

        return {
          id: student._id,
          name: student.name,
          email: user.role === 'TEACHER' ? student.email : undefined,
          quizScores: scores.map(score => ({
            score: score.score,
            maxScore: score.maxScore,
          })),
        }
      })
    )

    return NextResponse.json(studentsWithScores)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 