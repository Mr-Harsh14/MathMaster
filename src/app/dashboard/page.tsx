'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  UsersIcon,
  FolderIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface DashboardData {
  stats: {
    totalStudents?: number
    totalClasses: number
    totalQuizzes: number
    averageScore: number
    quizzesCompleted?: number
    rank?: number
    totalStudentsInRank?: number
  }
  recentActivity: {
    type: 'quiz' | 'attempt' | 'student' | 'class'
    title: string
    subtitle: string
    score?: number
    maxScore?: number
    date: string
  }[]
  upcomingQuizzes?: {
    id: string
    title: string
    className: string
    dueDate?: string
    totalQuestions: number
  }[]
  topPerformers?: {
    studentName: string
    score: number
    className: string
  }[]
  performanceByClass?: {
    className: string
    averageScore: number
    quizzesTaken: number
    rank: number
    totalStudents: number
  }[]
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isTeacher = session?.user?.role === 'TEACHER'

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchDashboardData()
    }
  }, [session])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="rounded-lg bg-white p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Dashboard data not available'}</p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Welcome back, {session?.user?.name}!
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Here's what's happening in your {isTeacher ? 'classes' : 'learning journey'}
              </p>
            </div>
            <div className="mt-4 sm:ml-4 sm:mt-0">
              <Button asChild>
                <Link href={isTeacher ? "/dashboard/classes" : "/dashboard/leaderboard"}>
                  <span>{isTeacher ? 'Manage Classes' : 'View Leaderboard'}</span>
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isTeacher ? (
          <>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.totalStudents}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/students"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View all students
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FolderIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Classes</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.totalClasses}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/classes"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View all classes
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Quizzes</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.totalQuizzes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/quizzes"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View all quizzes
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.averageScore}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/analytics"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View analytics
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Your Rank</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.stats.rank} / {dashboardData.stats.totalStudentsInRank}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/leaderboard"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View leaderboard
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FolderIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Enrolled Classes</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.totalClasses}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/classes"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View classes
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Quizzes Completed</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.quizzesCompleted}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/classes"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  Take a quiz
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.stats.averageScore}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <Link
                  href="/dashboard/classes"
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
                >
                  View performance
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
            <div className="mt-6 flow-root">
              <ul role="list" className="-mb-8">
                {dashboardData.recentActivity.map((activity, activityIdx) => (
                  <li key={activityIdx}>
                    <div className="relative pb-8">
                      {activityIdx !== dashboardData.recentActivity.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={classNames(
                              'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                              activity.type === 'quiz'
                                ? 'bg-blue-500'
                                : activity.type === 'attempt'
                                ? 'bg-green-500'
                                : activity.type === 'student'
                                ? 'bg-purple-500'
                                : 'bg-gray-500'
                            )}
                          >
                            {activity.type === 'quiz' ? (
                              <AcademicCapIcon className="h-5 w-5 text-white" />
                            ) : activity.type === 'attempt' ? (
                              <ChartBarIcon className="h-5 w-5 text-white" />
                            ) : activity.type === 'student' ? (
                              <UsersIcon className="h-5 w-5 text-white" />
                            ) : (
                              <FolderIcon className="h-5 w-5 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.title}
                              {activity.score !== undefined && (
                                <span className="ml-2 font-medium text-gray-900">
                                  ({activity.score}/{activity.maxScore})
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">{activity.subtitle}</p>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <time dateTime={activity.date}>
                              {new Date(activity.date).toLocaleDateString()}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Teacher: Top Performers or Student: Performance by Class */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {isTeacher ? 'Top Performers' : 'Your Performance by Class'}
            </h3>
            <div className="mt-6 flow-root">
              <ul role="list" className="divide-y divide-gray-200">
                {isTeacher
                  ? dashboardData.topPerformers?.map((performer, index) => (
                      <li key={index} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {index + 1}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {performer.studentName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{performer.className}</p>
                          </div>
                          <div>
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {performer.score}%
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  : dashboardData.performanceByClass?.map((classPerf, index) => (
                      <li key={index} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{classPerf.className}</h4>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <ChartBarIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                {classPerf.averageScore}% Average
                              </span>
                              <span className="flex items-center">
                                <AcademicCapIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                {classPerf.quizzesTaken} Quizzes
                              </span>
                              <span className="flex items-center">
                                <TrophyIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                Rank {classPerf.rank}/{classPerf.totalStudents}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Upcoming Quizzes (for students) */}
        {!isTeacher && dashboardData.upcomingQuizzes && (
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Quizzes</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboardData.upcomingQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/classes/${quiz.id}`}
                          className="focus:outline-none"
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">{quiz.title}</p>
                          <p className="text-sm text-gray-500 truncate">{quiz.className}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <ClockIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                            {quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString() : 'No due date'}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <AcademicCapIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                            {quiz.totalQuestions} Questions
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 