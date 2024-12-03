'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Student {
  id: string
  name: string | null
  email: string
  enrolledClasses: {
    id: string
    name: string
  }[]
  quizStats: {
    totalAttempts: number
    averageScore: number
    recentScore: {
      score: number
      maxScore: number
      quizTitle: string
      createdAt: string
    } | null
  }
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch('/api/students')
        if (!response.ok) {
          throw new Error('Failed to fetch students')
        }
        const data = await response.json()
        setStudents(data)
      } catch (error) {
        console.error('Error fetching students:', error)
        setError(error instanceof Error ? error.message : 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchStudents()
    }
  }, [session])

  if (!session?.user?.email || session?.user?.role !== 'TEACHER') {
    return (
      <div className="text-center">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only teachers can access the students page.
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
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading students</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase()
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Students
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
            placeholder="Search students..."
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Student List */}
      <div className="mt-8 space-y-6">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search query.' : 'Start by adding students to your classes.'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {student.name || 'Unnamed Student'}
                      </h3>
                      <span className="ml-2 text-sm text-gray-500">{student.email}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <FolderIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        {student.enrolledClasses.length} Classes:
                        <span className="ml-1 text-gray-900">
                          {student.enrolledClasses.map(c => c.name).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <AcademicCapIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        {student.quizStats.totalAttempts} Quizzes Completed
                        {student.quizStats.averageScore > 0 && (
                          <span className="ml-1 text-gray-900">
                            (Avg: {student.quizStats.averageScore}%)
                          </span>
                        )}
                      </div>
                      {student.quizStats.recentScore && (
                        <div className="flex items-center text-sm text-gray-500">
                          Latest Quiz: {student.quizStats.recentScore.quizTitle} -{' '}
                          <span className="text-gray-900">
                            {student.quizStats.recentScore.score}/{student.quizStats.recentScore.maxScore} (
                            {Math.round((student.quizStats.recentScore.score / student.quizStats.recentScore.maxScore) * 100)}%)
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