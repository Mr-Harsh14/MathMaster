'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import StudentsList from '@/components/classes/students-list'
import QuizList from '@/components/classes/quiz-list'
import CreateQuizDialog from '@/components/classes/create-quiz-dialog'
import { useState } from 'react'
import useClass from '@/hooks/use-class'

interface QuizAttempt {
  id: string
  studentName: string
  quizTitle: string
  score: number
  maxScore: number
  createdAt: string
}

interface ClassData {
  id: string
  name: string
  code: string
  teacher: {
    name: string | null
    email: string
  }
  _count: {
    students: number
    quizzes: number
  }
  recentActivity: {
    attempts: QuizAttempt[]
  }
}

export default function ClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'TEACHER'
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)
  const { classData, loading, error } = useClass(params.id)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading class</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => router.push('/dashboard/classes')}
          >
            Go back to classes
          </Button>
        </div>
      </div>
    )
  }

  const data = classData as ClassData

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {data.name}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Teacher: {data.teacher.name || data.teacher.email}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Class Code: {data.code}
            </div>
          </div>
        </div>
        {isTeacher && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Button onClick={() => setIsCreateQuizOpen(true)}>
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Create Quiz
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-base font-semibold leading-6 text-gray-900">Students</h3>
          <div className="mt-2 overflow-hidden rounded-lg bg-white shadow">
            <div className="p-4">
              <StudentsList classId={params.id} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
          <div className="mt-2 overflow-hidden bg-white shadow sm:rounded-lg">
            {data.recentActivity.attempts.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {data.recentActivity.attempts.map((attempt: QuizAttempt) => (
                    <li key={attempt.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">
                          {attempt.studentName} completed {attempt.quizTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          Score: {attempt.score}/{attempt.maxScore}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Quizzes</h3>
          <div className="mt-2 overflow-hidden rounded-lg bg-white shadow">
            <div className="p-4">
              <QuizList classId={params.id} />
            </div>
          </div>
        </div>
      </div>

      <CreateQuizDialog
        open={isCreateQuizOpen}
        onClose={() => setIsCreateQuizOpen(false)}
        classId={params.id}
      />
    </div>
  )
} 