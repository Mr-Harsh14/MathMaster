'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalStudents: number
  totalQuizzes: number
  totalAttempts: number
  averageScore: number
  classPerformance: {
    className: string
    averageScore: number
    totalStudents: number
    totalQuizzes: number
  }[]
  recentScores: {
    studentName: string
    quizTitle: string
    score: number
    maxScore: number
    createdAt: string
  }[]
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics', {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const data = await response.json()
        setAnalyticsData(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
        setError(error instanceof Error ? error.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchAnalytics()
    }
  }, [session])

  if (!session?.user?.email || session?.user?.role !== 'TEACHER') {
    return (
      <div className="text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only teachers can access analytics.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !analyticsData) {
    return (
      <div className="text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading analytics</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Analytics data not available'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Analytics Overview
          </h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Students</dt>
                  <dd className="text-lg font-medium text-gray-900">{analyticsData.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Total Quizzes</dt>
                  <dd className="text-lg font-medium text-gray-900">{analyticsData.totalQuizzes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Quiz Attempts</dt>
                  <dd className="text-lg font-medium text-gray-900">{analyticsData.totalAttempts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">Average Score</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analyticsData.averageScore}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Performance */}
      <div className="mt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Class Performance</h3>
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {analyticsData.classPerformance.map((classData, index) => (
              <li key={index} className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-indigo-600">{classData.className}</h4>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <UserGroupIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      {classData.totalStudents} Students
                      <ClipboardDocumentListIcon className="ml-4 mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      {classData.totalQuizzes} Quizzes
                    </div>
                  </div>
                  <div className="ml-6">
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">
                        {classData.averageScore}%
                      </p>
                      <p className="ml-2 text-sm text-gray-500">avg. score</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Scores */}
      <div className="mt-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Quiz Scores</h3>
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
          <ul role="list" className="divide-y divide-gray-200">
            {analyticsData.recentScores.map((score, index) => (
              <li key={index} className="px-4 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{score.studentName}</p>
                    <p className="text-sm text-gray-500">{score.quizTitle}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {score.score}/{score.maxScore} (
                      {Math.round((score.score / score.maxScore) * 100)}%)
                    </span>
                    <span className="ml-4 text-sm text-gray-500">
                      {new Date(score.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
} 