'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Quiz {
  id: string
  title: string
  createdAt: string
  _count: {
    questions: number
    scores: number
  }
  highestScore?: number
  maxScore?: number
}

export default function QuizList({ classId }: { classId: string }) {
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'TEACHER'
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/classes/${classId}/quizzes`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch quizzes')
      }
      const data = await response.json()
      console.log('Fetched quizzes:', data)
      setQuizzes(data)
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      fetchQuizzes()
    }
  }, [classId, session])

  if (!session?.user?.email) {
    return (
      <div className="text-center">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Not signed in</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please sign in to view quizzes.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading quizzes</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchQuizzes}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
        >
          Try again
        </button>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No quizzes</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isTeacher
            ? 'Get started by creating a new quiz.'
            : 'No quizzes available yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {quizzes.map((quiz) => (
          <li key={quiz.id}>
            <Link
              href={`/dashboard/classes/${classId}/quizzes/${quiz.id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="truncate text-sm font-medium text-indigo-600">
                      {quiz.title}
                    </p>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <ClipboardDocumentListIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        {quiz._count.questions} Questions
                      </div>
                      <div className="ml-6 flex items-center text-sm text-gray-500">
                        {isTeacher ? (
                          <span>{quiz._count.scores} Attempts</span>
                        ) : quiz.highestScore !== undefined ? (
                          <span>
                            Your Score: {quiz.highestScore}/{quiz.maxScore} (
                            {Math.round((quiz.highestScore / quiz.maxScore!) * 100)}%)
                          </span>
                        ) : (
                          <span>Not attempted</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex-shrink-0">
                    <div className="text-sm text-gray-500">
                      {new Date(quiz.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
} 