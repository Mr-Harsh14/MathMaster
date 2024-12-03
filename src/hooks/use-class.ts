'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export default function useClass(classId: string) {
  const { data: session } = useSession()
  const [classData, setClassData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchClass = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/classes/${classId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch class')
      }

      const data = await response.json()
      console.log('Fetched class data:', data)
      setClassData(data)
    } catch (error) {
      console.error('Error fetching class:', error)
      setError(error instanceof Error ? error.message : 'Failed to load class')
      throw error
    } finally {
      setLoading(false)
    }
  }, [classId, session?.user?.email])

  useEffect(() => {
    fetchClass()
  }, [fetchClass, refreshKey])

  const refresh = async () => {
    console.log('Refreshing class data...')
    setRefreshKey(prev => prev + 1)
    try {
      await fetchClass()
      console.log('Class data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing class:', error)
    }
  }

  return { classData, loading, error, refresh }
} 