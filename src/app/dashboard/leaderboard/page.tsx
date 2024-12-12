'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrophyIcon } from '@heroicons/react/24/outline'

interface LeaderboardEntry {
  studentName: string
  averageScore: number
  quizzesTaken: number
  classCount: number
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard')
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }
        const data = await response.json()
        setRankings(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch leaderboard')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
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

  if (rankings.length === 0) {
    return (
      <div className="text-center">
        <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">No students have taken any quizzes yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Leaderboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rankings based on average quiz scores across all classes
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {rankings.map((entry, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg">
                      {entry.studentName}
                    </CardTitle>
                  </div>
                  <div className="mt-1 flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                      {entry.quizzesTaken} quiz{entry.quizzesTaken === 1 ? '' : 'zes'} taken
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.classCount} class{entry.classCount === 1 ? '' : 'es'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {entry.averageScore}%
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={entry.averageScore} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 