'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface LeaderboardEntry {
  userId: string
  studentName: string
  totalScore: number
  totalMaxScore: number
  averageScore: number
  quizzesTaken: number
  recentScores: {
    quizTitle: string
    score: number
    maxScore: number
    createdAt: string
  }[]
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all')

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`)
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }
        const data = await response.json()
        setLeaderboard(data)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setError(error instanceof Error ? error.message : 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchLeaderboard()
    }
  }, [session, timeframe])

  if (!session?.user?.email) {
    return (
      <div className="text-center">
        <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Not signed in</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please sign in to view the leaderboard.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
        <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading leaderboard</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Student Leaderboard
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'all' | 'month' | 'week')}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.userId}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {index < 3 ? (
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <TrophyIcon className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 font-semibold">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="ml-6 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {entry.studentName}
                    </h3>
                    <p className="text-3xl font-semibold text-indigo-600">
                      {entry.averageScore}%
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <ChartBarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      {entry.totalScore}/{entry.totalMaxScore} Total Points
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ArrowTrendingUpIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                      {entry.quizzesTaken} Quizzes Completed
                    </div>
                    {entry.recentScores[0] && (
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                        Latest: {entry.recentScores[0].score}/{entry.recentScores[0].maxScore} on{' '}
                        {new Date(entry.recentScores[0].createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No rankings yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Complete some quizzes to appear on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 