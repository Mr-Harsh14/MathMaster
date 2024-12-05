'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface Quiz {
  id: string
  title: string
  createdAt: string
  _count: {
    questions: number
    scores: number
  }
}

export default function QuizList({ classId }: { classId: string }) {
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'TEACHER'
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const response = await fetch(`/api/classes/${classId}/quizzes`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch quizzes')
        }

        setQuizzes(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching quizzes:', error)
        setError(error instanceof Error ? error.message : 'Failed to load quizzes')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchQuizzes()
    }
  }, [classId, session])

  const handleDelete = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(quizId);
    try {
      const response = await fetch(`/api/classes/${classId}/quizzes/${quizId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete quiz");
      }

      setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert(error instanceof Error ? error.message : "Failed to delete quiz. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
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

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="text-center">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isTeacher
            ? "Get started by creating a new quiz."
            : "No quizzes available yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="p-4 bg-white">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
              {isTeacher && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(quiz.id)}
                  disabled={isDeleting === quiz.id}
                >
                  {isDeleting === quiz.id ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {quiz._count.questions} Questions
              </div>
              <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {quiz._count.scores} Attempts
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/classes/${classId}/quizzes/${quiz.id}`)}
              className="w-full"
            >
              {isTeacher ? "Edit Quiz" : "Take Quiz"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
} 