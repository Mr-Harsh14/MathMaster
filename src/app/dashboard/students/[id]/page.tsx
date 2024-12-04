'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface StudentDetails {
  id: string
  name: string
  email: string
  enrolledClasses: {
    id: string
    name: string
    averageScore: number
    completedQuizzes: number
    totalQuizzes: number
  }[]
  quizAttempts: {
    id: string
    quizTitle: string
    className: string
    score: number
    maxScore: number
    createdAt: string
  }[]
  stats: {
    totalAttempts: number
    averageScore: number
    bestScore: number
    worstScore: number
  }
}

export default function StudentDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudentDetails() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/students/${params.id}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to fetch student details')
        }
        
        const data = await response.json()
        setStudent(data)
      } catch (error) {
        console.error('Error fetching student details:', error)
        setError(error instanceof Error ? error.message : 'Failed to load student details')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email && status === 'authenticated') {
      fetchStudentDetails()
    }
  }, [session, status, params.id])

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="rounded-lg bg-white p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading student details</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Student not found'}</p>
        <div className="mt-6">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="mr-4"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {student.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{student.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.stats.averageScore}%</div>
            <Progress value={student.stats.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Quizzes Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Best Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{student.stats.bestScore}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Worst Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{student.stats.worstScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>Student's performance across different classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {student.enrolledClasses.map((classData) => (
              <div key={classData.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium">{classData.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {classData.completedQuizzes} of {classData.totalQuizzes} quizzes completed
                  </span>
                </div>
                <Progress value={classData.averageScore} />
                <p className="text-sm text-gray-500 text-right">
                  Average Score: {classData.averageScore}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Quiz Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quiz Attempts</CardTitle>
          <CardDescription>Latest quiz performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {student.quizAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">{attempt.quizTitle}</p>
                  <p className="text-sm text-gray-500">{attempt.className}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium">
                    {Math.round((attempt.score / attempt.maxScore) * 100)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {attempt.score}/{attempt.maxScore} points
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 