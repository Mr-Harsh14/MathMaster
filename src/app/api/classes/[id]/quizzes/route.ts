import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/classes/[id]/quizzes - Get all quizzes for a class
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user has access to this class
    const classAccess = await prisma.class.findFirst({
      where: {
        id: params.id,
        OR: [
          { teacherId: user.id },
          { students: { some: { id: user.id } } },
        ],
      },
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Get quizzes with different data based on user role
    if (user.role === 'TEACHER') {
      const quizzes = await prisma.quiz.findMany({
        where: { classId: params.id },
        include: {
          _count: {
            select: {
              questions: true,
              scores: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(quizzes)
    } else {
      // For students, include their scores
      const quizzes = await prisma.quiz.findMany({
        where: { classId: params.id },
        include: {
          _count: {
            select: {
              questions: true,
              scores: true,
            },
          },
          scores: {
            where: { userId: user.id },
            select: {
              score: true,
              maxScore: true,
            },
          },
          questions: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Transform the data to include the student's highest score
      const formattedQuizzes = quizzes.map((quiz) => ({
        ...quiz,
        highestScore: quiz.scores[0]?.score || undefined,
        maxScore: quiz.questions.length * 1, // Assuming 1 point per question
        scores: undefined, // Remove the scores array
        questions: undefined, // Remove the questions array
      }))

      return NextResponse.json(formattedQuizzes)
    }
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/classes/[id]/quizzes - Create a new quiz
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Only teachers can create quizzes' },
        { status: 403 }
      )
    }

    // Check if user has access to this class
    const classAccess = await prisma.class.findFirst({
      where: {
        id: params.id,
        teacherId: user.id,
      },
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, questions, timeLimit } = body

    // Validate input
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: 'Invalid quiz data' },
        { status: 400 }
      )
    }

    // Validate each question
    for (const q of questions) {
      if (
        !q.question ||
        !q.options ||
        !Array.isArray(q.options) ||
        q.options.length === 0 ||
        !q.answer ||
        !q.options.includes(q.answer)
      ) {
        return NextResponse.json(
          { message: 'Invalid question format' },
          { status: 400 }
        )
      }
    }

    // Create quiz with questions
    const quiz = await prisma.quiz.create({
      data: {
        title,
        classId: params.id,
        timeLimit,
        questions: {
          create: questions.map(q => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          })),
        },
      },
      include: {
        questions: true,
      },
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { message: 'Failed to create quiz' },
      { status: 500 }
    )
  }
} 