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
        quizAttempts
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
        prisma.quizAttempt.findMany({
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
      const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
      const totalMaxScore = quizAttempts.reduce((sum, attempt) => sum + attempt.maxScore, 0)
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
      recentActivity = quizAttempts.map(attempt => ({
        type: 'attempt',
        title: `${attempt.user.name || attempt.user.email} completed ${attempt.quiz.title}`,
        subtitle: `in ${attempt.quiz.class.name}`,
        score: attempt.score,
        maxScore: attempt.maxScore,
        date: attempt.createdAt.toISOString()
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
        quizAttempts,
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
        prisma.quizAttempt.findMany({
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
            dueDate: true,
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
            },
            AND: {
              quizAttempts: {
                every: {
                  score: {
                    gt: {
                      _avg: {
                        score: {
                          where: {
                            userId: user.id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
      ])

      // Calculate average score
      const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
      const totalMaxScore = quizAttempts.reduce((sum, attempt) => sum + attempt.maxScore, 0)
      const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

      stats = {
        totalClasses: classesCount,
        quizzesCompleted: quizAttempts.length,
        averageScore,
        rank: studentRank + 1,
        totalStudentsInRank: await prisma.user.count({
          where: {
            role: 'STUDENT',
            quizAttempts: {
              some: {}
            }
          }
        })
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
            where: {
              quizAttempts: {
                some: {
                  quiz: {
                    classId: {
                      equals: prisma.class.fields.id
                    }
                  }
                }
              }
            }
          },
          quizzes: {
            where: {
              scores: {
                some: {
                  userId: user.id
                }
              }
            },
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
          rank: 1, // Placeholder - would need more complex query for actual rank
          totalStudents: classData.students.length
        }
      })

      // Format recent activity
      recentActivity = quizAttempts.slice(0, 10).map(attempt => ({
        type: 'quiz',
        title: `Completed ${attempt.quiz.title}`,
        subtitle: `in ${attempt.quiz.class.name}`,
        score: attempt.score,
        maxScore: attempt.maxScore,
        date: attempt.createdAt.toISOString()
      }))

      // Format upcoming quizzes
      const formattedUpcomingQuizzes = upcomingQuizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        className: quiz.class.name,
        dueDate: quiz.dueDate?.toISOString(),
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