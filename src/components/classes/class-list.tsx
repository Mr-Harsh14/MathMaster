'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { UsersIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

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
  const { data: session, status } = useSession()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClasses() {
      try {
        const response = await fetch('/api/classes')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch classes')
        }

        if (!Array.isArray(data)) {
          console.error('Invalid response format:', data)
          throw new Error('Unexpected response format')
        }

        setClasses(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching classes:', error)
        setError(error instanceof Error ? error.message : 'Failed to load classes')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated' && session?.user?.email) {
      fetchClasses()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [session, status])

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(classId);
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete class");
      }

      // Remove the deleted class from the state
      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
    } catch (error) {
      console.error("Error deleting class:", error);
      alert(error instanceof Error ? error.message : "Failed to delete class. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (status === 'loading' || loading) {
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

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="text-center">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {isTeacher ? "No classes created" : "No classes joined"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {isTeacher
            ? "Get started by creating a new class."
            : "Join a class using a class code."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {classes.map((class_) => (
        <Card key={class_.id} className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{class_.name}</h3>
              {isTeacher && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(class_.id)}
                  disabled={isDeleting === class_.id}
                >
                  {isDeleting === class_.id ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div>Students: {class_._count.students}</div>
              <div>Quizzes: {class_._count.quizzes}</div>
            </div>
            
            {isTeacher && (
              <div className="text-sm text-gray-500">
                Class Code: <span className="font-mono">{class_.code}</span>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/classes/${class_.id}`)}
            >
              View Details
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
} 