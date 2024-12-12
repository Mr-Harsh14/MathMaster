'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import useClass from '@/hooks/use-class'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import StudentsList from '@/components/classes/students-list'
import QuizList from '@/components/classes/quiz-list'
import {
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

type TabType = 'overview' | 'students' | 'quizzes'

export default function ClassPage() {
  const { data: session } = useSession()
  const params = useParams()
  const { classData, loading, error, refresh } = useClass(params.id as string)
  const isTeacher = session?.user?.role === 'TEACHER'
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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

  if (error || !classData) {
    return (
      <div className="rounded-lg bg-white p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading class</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Class data not available'}</p>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{classData.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Class Code: <span className="font-mono">{classData.code}</span>
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`${
              activeTab === 'students'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`${
              activeTab === 'quizzes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            Quizzes
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Students</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {classData.stats.totalStudents}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <AcademicCapIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Quizzes</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {classData.stats.totalQuizzes}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {classData.stats.averageScore}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Recent Activity</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {classData.recentActivity.attempts.length}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          {classData.recentActivity.attempts.length > 0 && (
            <Card className="bg-white">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <div className="mt-6 flow-root">
                  <ul role="list" className="-mb-8">
                    {classData.recentActivity.attempts.map((activity, activityIdx) => (
                      <li key={activityIdx}>
                        <div className="relative pb-8">
                          {activityIdx !== classData.recentActivity.attempts.length - 1 ? (
                            <span
                              className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div className="relative">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                                <AcademicCapIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm text-gray-500">
                                  <span className="font-medium text-gray-900">{activity.studentName}</span>
                                  {' completed '}
                                  <span className="font-medium text-gray-900">{activity.quizTitle}</span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  Score: {activity.score}/{activity.maxScore} (
                                  {Math.round((activity.score / activity.maxScore) * 100)}%)
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  {new Date(activity.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {activeTab === 'students' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <StudentsList classId={params.id as string} />
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Quizzes</h3>
          <QuizList classId={params.id as string} isTeacher={isTeacher} onQuizDeleted={refresh} />
        </div>
      )}
    </div>
  )
} 