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
    console.log('Session:', session)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Please sign in to create a quiz' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })
    console.log('User:', user)

    if (!user) {
      return NextResponse.json(
        { message: 'User account not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Only teachers can create quizzes' },
        { status: 403 }
      )
    }

    // Check if user is the teacher of this class
    const classAccess = await prisma.class.findFirst({
      where: {
        id: params.id,
        teacherId: user.id,
      },
    })
    console.log('Class access:', classAccess)

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    const body = await req.json()
    console.log('Received request body:', JSON.stringify(body, null, 2))

    const { title, questions, timeLimit } = body

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { message: 'Please provide a valid quiz title' },
        { status: 400 }
      )
    }

    // Validate questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: 'Please provide at least one question' },
        { status: 400 }
      )
    }

    // Validate each question
    for (const q of questions) {
      console.log('Validating question:', q)
      if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
        return NextResponse.json(
          { message: 'Each question must have valid text' },
          { status: 400 }
        )
      }

      if (!Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json(
          { message: 'Each question must have at least 2 options' },
          { status: 400 }
        )
      }

      if (!q.options.every(opt => typeof opt === 'string' && opt.trim().length > 0)) {
        return NextResponse.json(
          { message: 'All options must be non-empty text' },
          { status: 400 }
        )
      }

      if (!q.answer || typeof q.answer !== 'string' || !q.options.includes(q.answer)) {
        return NextResponse.json(
          { message: 'Each question must have a valid answer from its options' },
          { status: 400 }
        )
      }
    }

    // Validate timeLimit
    if (timeLimit !== null && (typeof timeLimit !== 'number' || timeLimit < 1 || timeLimit > 180)) {
      return NextResponse.json(
        { message: 'Time limit must be between 1 and 180 minutes' },
        { status: 400 }
      )
    }

    console.log('Creating quiz with data:', {
      title,
      classId: params.id,
      timeLimit,
      questionCount: questions.length,
    })

    try {
      // Create quiz with questions
      const quizData = {
        title: title.trim(),
        classId: params.id,
        questions: {
          create: questions.map((q: any) => ({
            question: q.question.trim(),
            options: q.options.map((opt: string) => opt.trim()),
            answer: q.answer.trim(),
            explanation: q.explanation?.trim() || null,
          })),
        },
      }

      // Only add timeLimit if it's a valid number
      if (typeof timeLimit === 'number' && timeLimit > 0 && timeLimit <= 180) {
        (quizData as any).timeLimit = timeLimit
      }

      console.log('Creating quiz with data:', quizData)

      const quiz = await prisma.quiz.create({
        data: quizData,
        include: {
          questions: true,
          _count: {
            select: {
              questions: true,
              scores: true,
            },
          },
        },
      })

      console.log('Quiz created successfully:', quiz.id)
      return NextResponse.json(quiz, { status: 201 })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { message: 'Database error: ' + (dbError instanceof Error ? dbError.message : 'Unknown error') },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json(
      { message: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
} 