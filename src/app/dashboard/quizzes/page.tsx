'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Quiz {
  id: string
  title: string
  className: string
  classId: string
  createdAt: string
  stats: {
    totalQuestions: number
    totalAttempts: number
    averageScore: number
    recentAttempt: {
      studentName: string
      score: number
      maxScore: number
      createdAt: string
    } | null
  }
}

interface UserRole {
  role: string | null;
}

export default function QuizzesPage() {
  const { data: session } = useSession()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function checkRole() {
      try {
        const response = await fetch('/api/auth/check-role')
        if (!response.ok) {
          throw new Error('Failed to check role')
        }
        const data: UserRole = await response.json()
        setUserRole(data.role)
      } catch (error) {
        console.error('Error checking role:', error)
        setError(error instanceof Error ? error.message : 'Failed to check role')
      }
    }

    if (session?.user?.email) {
      checkRole()
    }
  }, [session])

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const response = await fetch('/api/quizzes')
        if (!response.ok) {
          throw new Error('Failed to fetch quizzes')
        }
        const data = await response.json()
        setQuizzes(data)
      } catch (error) {
        console.error('Error fetching quizzes:', error)
        setError(error instanceof Error ? error.message : 'Failed to load quizzes')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email && userRole === 'TEACHER') {
      fetchQuizzes()
    }
  }, [session, userRole])

  if (!session?.user?.email || userRole !== 'TEACHER') {
    return (
      <div className="text-center">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only teachers can access the quizzes page.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading quizzes</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const searchLower = searchQuery.toLowerCase()
    return (
      quiz.title.toLowerCase().includes(searchLower) ||
      quiz.className.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Quizzes
          </h2>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes..."
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Quiz List */}
      <div className="mt-8 space-y-6">
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No quizzes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search query.' : 'Start by creating a quiz in one of your classes.'}
            </p>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          {quiz.title}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <FolderIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                          {quiz.className}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/classes/${quiz.classId}/quizzes/${quiz.id}`}
                        className="ml-4"
                      >
                        <Button>View Details</Button>
                      </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <ClipboardDocumentListIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        {quiz.stats.totalQuestions} Questions
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        {quiz.stats.totalAttempts} Attempts
                        {quiz.stats.averageScore > 0 && (
                          <span className="ml-1 text-gray-900">
                            (Avg: {quiz.stats.averageScore}%)
                          </span>
                        )}
                      </div>
                      {quiz.stats.recentAttempt && (
                        <div className="flex items-center text-sm text-gray-500">
                          <ChartBarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                          Latest: {quiz.stats.recentAttempt.studentName} -{' '}
                          <span className="text-gray-900">
                            {quiz.stats.recentAttempt.score}/{quiz.stats.recentAttempt.maxScore} (
                            {Math.round((quiz.stats.recentAttempt.score / quiz.stats.recentAttempt.maxScore) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 