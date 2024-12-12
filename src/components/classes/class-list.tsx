'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { UsersIcon, BookOpenIcon } from '@heroicons/react/24/outline'

interface Class {
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
  updatedAt: string
}

export default function ClassList({ isTeacher }: { isTeacher: boolean }) {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchClasses() {
    try {
      const response = await fetch('/api/classes', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }

      const data = await response.json()
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
      setError(error instanceof Error ? error.message : 'Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()

    // Set up interval to refresh data
    const intervalId = setInterval(fetchClasses, 5000)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading classes</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchClasses()
            }}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="text-center">
        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No classes</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isTeacher
            ? 'Get started by creating a new class.'
            : 'Get started by joining a class.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {classes.map((classItem) => (
        <Link key={classItem.id} href={`/dashboard/classes/${classItem.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
              <CardDescription>
                {isTeacher ? `Class Code: ${classItem.code}` : `Teacher: ${classItem.teacher.name || classItem.teacher.email}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  {classItem._count.students} student{classItem._count.students !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {classItem._count.quizzes} quiz{classItem._count.quizzes !== 1 ? 'zes' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
} 