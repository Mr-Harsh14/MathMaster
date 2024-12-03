import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string; quizId: string } }
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

    // Get quiz with different data based on user role
    if (user.role === 'TEACHER') {
      const quiz = await prisma.quiz.findUnique({
        where: { id: params.quizId },
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

      if (!quiz || quiz.classId !== params.id) {
        return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
      }

      return NextResponse.json(quiz)
    } else {
      // For students, don't include answers
      const quiz = await prisma.quiz.findUnique({
        where: { id: params.quizId },
        select: {
          id: true,
          title: true,
          timeLimit: true,
          classId: true,
          createdAt: true,
          updatedAt: true,
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
            },
          },
          scores: {
            where: { userId: user.id },
            select: {
              score: true,
              maxScore: true,
            },
          },
          _count: {
            select: {
              questions: true,
              scores: true,
            },
          },
        },
      })

      if (!quiz || quiz.classId !== params.id) {
        return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
      }

      // If student has already taken the quiz, return their score
      if (quiz.scores.length > 0) {
        const highestScore = Math.max(...quiz.scores.map(s => s.score))
        return NextResponse.json({
          ...quiz,
          highestScore,
          maxScore: quiz.questions.length,
          scores: undefined,
        })
      }

      return NextResponse.json({
        ...quiz,
        scores: undefined,
      })
    }
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; quizId: string } }
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

    if (user.role === 'TEACHER') {
      return NextResponse.json(
        { message: 'Teachers cannot take quizzes' },
        { status: 403 }
      )
    }

    // Check if user has access to this class
    const classAccess = await prisma.class.findFirst({
      where: {
        id: params.id,
        students: { some: { id: user.id } },
      },
    })

    if (!classAccess) {
      return NextResponse.json(
        { message: 'Class not found or access denied' },
        { status: 404 }
      )
    }

    // Get quiz with answers to grade
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: {
          select: {
            id: true,
            answer: true,
            explanation: true,
          },
        },
      },
    })

    if (!quiz || quiz.classId !== params.id) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 })
    }

    const { answers } = await req.json()

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { message: 'Invalid answers format' },
        { status: 400 }
      )
    }

    // Grade the quiz
    let score = 0
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].answer) {
        score++
      }
    }

    // Save the score
    await prisma.score.create({
      data: {
        userId: user.id,
        quizId: params.quizId,
        score,
        maxScore: quiz.questions.length,
      },
    })

    return NextResponse.json({
      score,
      maxScore: quiz.questions.length,
      correctAnswers: quiz.questions.map(q => q.answer),
      explanations: quiz.questions.map(q => q.explanation),
    })
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 