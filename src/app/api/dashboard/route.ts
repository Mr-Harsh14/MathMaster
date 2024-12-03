import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const isTeacher = user.role === 'TEACHER'

    // Base stats that both teachers and students need
    let stats: any = {}
    let recentActivity = []

    if (isTeacher) {
      // Teacher-specific data
      const [
        studentsCount,
        classesCount,
        quizzesCount,
        scores
      ] = await Promise.all([
        prisma.user.count({
          where: {
            role: 'STUDENT',
            classesJoined: {
              some: {
                teacherId: user.id
              }
            }
          }
        }),
        prisma.class.count({
          where: {
            teacherId: user.id
          }
        }),
        prisma.quiz.count({
          where: {
            class: {
              teacherId: user.id
            }
          }
        }),
        prisma.score.findMany({
          where: {
            quiz: {
              class: {
                teacherId: user.id
              }
            }
          },
          select: {
            score: true,
            maxScore: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            },
            quiz: {
              select: {
                title: true,
                class: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        })
      ])

      // Calculate average score
      const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
      const totalMaxScore = scores.reduce((sum, score) => sum + score.maxScore, 0)
      const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

      stats = {
        totalStudents: studentsCount,
        totalClasses: classesCount,
        totalQuizzes: quizzesCount,
        averageScore
      }

      // Get top performers
      const topPerformers = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          classesJoined: {
            some: {
              teacherId: user.id
            }
          },
          quizAttempts: {
            some: {}
          }
        },
        select: {
          name: true,
          classesJoined: {
            where: {
              teacherId: user.id
            },
            select: {
              name: true
            }
          },
          quizAttempts: {
            where: {
              quiz: {
                class: {
                  teacherId: user.id
                }
              }
            },
            select: {
              score: true,
              maxScore: true
            }
          }
        },
        take: 5
      })

      const formattedTopPerformers = topPerformers.map(performer => {
        const totalScore = performer.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
        const totalMaxScore = performer.quizAttempts.reduce((sum, attempt) => sum + attempt.maxScore, 0)
        const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

        return {
          studentName: performer.name,
          className: performer.classesJoined[0]?.name || 'Multiple Classes',
          score: averageScore
        }
      }).sort((a, b) => b.score - a.score)

      // Format recent activity
      recentActivity = scores.map(score => ({
        type: 'attempt',
        title: `${score.user.name || score.user.email} completed ${score.quiz.title}`,
        subtitle: `in ${score.quiz.class.name}`,
        score: score.score,
        maxScore: score.maxScore,
        date: score.createdAt.toISOString()
      }))

      return NextResponse.json({
        stats,
        recentActivity,
        topPerformers: formattedTopPerformers
      })

    } else {
      // Student-specific data
      const [
        classesCount,
        scores,
        upcomingQuizzes,
        studentRank
      ] = await Promise.all([
        prisma.class.count({
          where: {
            students: {
              some: {
                id: user.id
              }
            }
          }
        }),
        prisma.score.findMany({
          where: {
            userId: user.id
          },
          select: {
            score: true,
            maxScore: true,
            createdAt: true,
            quiz: {
              select: {
                title: true,
                class: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.quiz.findMany({
          where: {
            class: {
              students: {
                some: {
                  id: user.id
                }
              }
            },
            NOT: {
              scores: {
                some: {
                  userId: user.id
                }
              }
            }
          },
          select: {
            id: true,
            title: true,
            timeLimit: true,
            questions: {
              select: {
                id: true
              }
            },
            class: {
              select: {
                name: true
              }
            }
          },
          take: 6
        }),
        prisma.user.count({
          where: {
            role: 'STUDENT',
            quizAttempts: {
              some: {}
            }
          }
        })
      ])

      // Calculate average score
      const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
      const totalMaxScore = scores.reduce((sum, score) => sum + score.maxScore, 0)
      const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

      stats = {
        totalClasses: classesCount,
        quizzesCompleted: scores.length,
        averageScore,
        rank: 1, // Simplified ranking for now
        totalStudentsInRank: studentRank
      }

      // Get performance by class
      const classPerformance = await prisma.class.findMany({
        where: {
          students: {
            some: {
              id: user.id
            }
          }
        },
        select: {
          id: true,
          name: true,
          students: {
            select: {
              id: true
            }
          },
          quizzes: {
            select: {
              scores: {
                where: {
                  userId: user.id
                },
                select: {
                  score: true,
                  maxScore: true
                }
              }
            }
          }
        }
      })

      const performanceByClass = classPerformance.map(classData => {
        const attempts = classData.quizzes.flatMap(quiz => quiz.scores)
        const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
        const totalMaxScore = attempts.reduce((sum, attempt) => sum + attempt.maxScore, 0)
        const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

        return {
          className: classData.name,
          averageScore,
          quizzesTaken: attempts.length,
          rank: 1, // Simplified ranking for now
          totalStudents: classData.students.length
        }
      })

      // Format recent activity
      recentActivity = scores.slice(0, 10).map(score => ({
        type: 'quiz',
        title: `Completed ${score.quiz.title}`,
        subtitle: `in ${score.quiz.class.name}`,
        score: score.score,
        maxScore: score.maxScore,
        date: score.createdAt.toISOString()
      }))

      // Format upcoming quizzes
      const formattedUpcomingQuizzes = upcomingQuizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        className: quiz.class.name,
        dueDate: null, // We don't have due dates in our schema yet
        totalQuestions: quiz.questions.length
      }))

      return NextResponse.json({
        stats,
        recentActivity,
        performanceByClass,
        upcomingQuizzes: formattedUpcomingQuizzes
      })
    }
  } catch (error) {
    console.error('Error in dashboard route:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 