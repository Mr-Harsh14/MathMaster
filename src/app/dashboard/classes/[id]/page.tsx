'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import StudentsList from '@/components/classes/students-list'
import QuizList from '@/components/classes/quiz-list'
import CreateQuizDialog from '@/components/classes/create-quiz-dialog'
import useClass from '@/hooks/use-class'

export default function ClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'TEACHER'
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'quizzes'>('overview')
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)
  const { classData, loading, error } = useClass(params.id)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="text-center text-gray-500">
        <p>Class not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Teacher: {classData.teacher.name || classData.teacher.email}
            </p>
            {isTeacher && (
              <p className="mt-1 text-sm font-mono text-gray-500">
                Class Code: {classData.code}
              </p>
            )}
          </div>
          {isTeacher && (
            <Button onClick={() => setIsCreateQuizOpen(true)}>
              Create Quiz
            </Button>
          )}
        </div>

        {/* Stats Overview */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white shadow-sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {classData._count.students}
              </p>
            </div>
          </Card>
          <Card className="bg-white shadow-sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Quizzes</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {classData._count.quizzes}
              </p>
            </div>
          </Card>
          <Card className="bg-white shadow-sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Recent Activity</h3>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {classData.recentActivity.attempts.length}
              </p>
            </div>
          </Card>
        </div>

        {/* Navigation */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`${
                activeTab === 'quizzes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-800'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              Quizzes
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
              {classData.recentActivity.attempts.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul role="list" className="divide-y divide-gray-200">
                    {classData.recentActivity.attempts.map((attempt) => (
                      <li key={attempt.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{attempt.studentName}</span>
                            {' completed '}
                            <span className="font-medium">{attempt.quizTitle}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Score: {attempt.score}/{attempt.maxScore} (
                            {Math.round((attempt.score / attempt.maxScore) * 100)}%)
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Students</h2>
              {classData.recentActivity.students.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul role="list" className="divide-y divide-gray-200">
                    {classData.recentActivity.students.map((student) => (
                      <li key={student.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name || 'Unnamed Student'}
                          </div>
                          {isTeacher && student.email && (
                            <div className="text-sm text-gray-500">{student.email}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No students yet</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Quizzes</h2>
              {classData.recentActivity.quizzes.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul role="list" className="divide-y divide-gray-200">
                    {classData.recentActivity.quizzes.map((quiz) => (
                      <li key={quiz.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">
                            {quiz.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {quiz._count.questions} questions • {quiz._count.scores} attempts
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No quizzes yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <StudentsList classId={params.id} />
        )}

        {activeTab === 'quizzes' && (
          <QuizList classId={params.id} />
        )}
      </div>

      <CreateQuizDialog
        open={isCreateQuizOpen}
        onClose={() => setIsCreateQuizOpen(false)}
        classId={params.id}
      />
    </div>
  )
} 