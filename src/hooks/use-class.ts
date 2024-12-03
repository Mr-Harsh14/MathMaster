import { useState, useEffect } from 'react'

interface ClassData {
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

export default function useClass(classId: string) {
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClass() {
      try {
        const response = await fetch(`/api/classes/${classId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch class')
        }
        const data = await response.json()
        setClassData(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchClass()
  }, [classId])

  return { classData, loading, error }
} 