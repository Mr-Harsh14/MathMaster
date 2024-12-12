'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UsersIcon } from '@heroicons/react/24/outline'

interface Student {
  id: string
  name: string | null
  email: string
  quizScores: {
    score: number
    maxScore: number
  }[]
}

export default function StudentsList({ classId }: { classId: string }) {
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'TEACHER'
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        const response = await fetch(`/api/classes/${classId}/students`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to fetch students:', errorData)
          throw new Error(errorData.message || 'Failed to fetch students')
        }
        const data = await response.json()
        if (!Array.isArray(data)) {
          console.error('Invalid students data:', data)
          throw new Error('Invalid response format')
        }
        setStudents(data)
      } catch (error) {
        console.error('Error in fetchStudents:', error)
        setError(error instanceof Error ? error.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    if (classId) {
      fetchStudents()
    }
  }, [classId])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
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

  if (!students || students.length === 0) {
    return (
      <div className="text-center">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No students found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Share the class code with students to let them join.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {students.map((student) => {
          const totalScore = student.quizScores?.reduce((sum, score) => sum + score.score, 0) || 0
          const totalMaxScore = student.quizScores?.reduce((sum, score) => sum + score.maxScore, 0) || 0
          const averageScore = totalMaxScore > 0 
            ? Math.round((totalScore / totalMaxScore) * 100) 
            : 0

          return (
            <li key={student.id}>
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <div className="flex text-sm">
                      <p className="truncate font-medium text-indigo-600">
                        {student.name || 'Unnamed Student'}
                      </p>
                      {isTeacher && (
                        <p className="ml-1 flex-shrink-0 text-gray-400">
                          ({student.email})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex-shrink-0 sm:mt-0">
                    <div className="flex items-center space-x-2">
                      <dt className="text-sm font-medium text-gray-500">Average Score:</dt>
                      <dd className="text-sm font-medium text-gray-900">{averageScore}%</dd>
                    </div>
                    <div className="flex items-center space-x-2">
                      <dt className="text-sm font-medium text-gray-500">Quizzes Taken:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {student.quizScores?.length || 0}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
} 