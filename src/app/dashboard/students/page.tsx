'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

interface Student {
  id: string
  name: string
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
  const { data: session, status } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/students')
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to fetch students')
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

    if (session?.user?.email && status === 'authenticated') {
      fetchStudents()
    }
  }, [session, status])

  // Get unique list of classes from all students
  const classes = Array.from(
    new Set(
      students.flatMap(student => 
        student.enrolledClasses.map(c => ({ id: c.id, name: c.name }))
      )
    )
  )

  // Filter students based on search query and selected class
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesClass = 
      selectedClass === 'all' || 
      student.enrolledClasses.some(c => c.id === selectedClass)

    return matchesSearch && matchesClass
  })

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="rounded-lg bg-white p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">Please sign in to view this page.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading students</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <Button 
            onClick={() => {
              setLoading(true)
              setError(null)
              window.location.reload()
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Student Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor your students' progress across all classes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="all">All Classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Student Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
              <CardDescription>{student.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Classes */}
                <div className="flex items-center text-sm">
                  <AcademicCapIcon className="mr-2 h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">
                    {student.enrolledClasses.length} Classes Enrolled
                  </span>
                </div>

                {/* Quiz Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <ChartBarIcon className="mr-2 h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">Average Score</span>
                    </div>
                    <span className="font-medium">{student.quizStats.averageScore}%</span>
                  </div>
                  <Progress value={student.quizStats.averageScore} />
                </div>

                {/* Recent Activity */}
                {student.quizStats.recentScore && (
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="flex items-center text-sm">
                      <ClockIcon className="mr-2 h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">Recent Quiz:</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <p className="font-medium text-gray-900">
                        {student.quizStats.recentScore.quizTitle}
                      </p>
                      <p className="text-gray-500">
                        Score: {student.quizStats.recentScore.score}/{student.quizStats.recentScore.maxScore}
                      </p>
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <Button 
                  className="w-full" 
                  variant="outline" 
                  asChild
                >
                  <Link href={`/dashboard/students/${student.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
} 