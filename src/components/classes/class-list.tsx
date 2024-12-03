'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { UsersIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  code: string
  teacherId: string
  teacher: {
    name: string | null
    email: string
  }
  _count: {
    students: number
    quizzes: number
  }
}

export default function ClassList({ isTeacher }: { isTeacher: boolean }) {
  const { data: session } = useSession()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClasses() {
      try {
        const response = await fetch('/api/classes')
        const data = await response.json()
        setClasses(data)
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="text-center">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No classes</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isTeacher
            ? 'Get started by creating a new class.'
            : 'Join a class using a class code.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((classItem) => (
        <Link
          key={classItem.id}
          href={`/dashboard/classes/${classItem.id}`}
          className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex flex-1 flex-col p-6">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xl font-semibold text-gray-900">{classItem.name}</p>
                <p className="text-sm text-gray-500">Code: {classItem.code}</p>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Teacher: {classItem.teacher.name || classItem.teacher.email}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-8">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {classItem._count.students} Students
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-gray-500">
                  {classItem._count.quizzes} Quizzes
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 