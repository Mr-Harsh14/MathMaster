'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Quiz {
  id: string
  title: string
  createdAt: string
  _count: {
    questions: number
    scores: number
  }
}

interface QuizListProps {
  classId: string;
  isTeacher?: boolean | null;
  onQuizDeleted?: () => void;
}

export default function QuizList({ classId, isTeacher = false, onQuizDeleted }: QuizListProps) {
  const { data: session } = useSession()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newQuiz, setNewQuiz] = useState({ title: '', description: '', timeLimit: '' })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
      onQuizDeleted?.();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert(error instanceof Error ? error.message : "Failed to delete quiz. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const response = await fetch(`/api/classes/${classId}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newQuiz.title,
          description: newQuiz.description,
          timeLimit: newQuiz.timeLimit ? parseInt(newQuiz.timeLimit) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create quiz')
      }

      setQuizzes(prevQuizzes => [...prevQuizzes, data])
      setNewQuiz({ title: '', description: '', timeLimit: '' })
      setIsDialogOpen(false)
      router.push(`/dashboard/classes/${classId}/quizzes/${data.id}`)
    } catch (error) {
      console.error('Error creating quiz:', error)
      alert(error instanceof Error ? error.message : 'Failed to create quiz. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

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
        {isTeacher && (
          <div className="mt-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Quiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Quiz</DialogTitle>
                  <DialogDescription>
                    Create a new quiz for your class. You can add questions after creating the quiz.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateQuiz} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                      id="title"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                      placeholder="Enter quiz title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newQuiz.description}
                      onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                      placeholder="Enter quiz description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={newQuiz.timeLimit}
                      onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: e.target.value })}
                      placeholder="Enter time limit in minutes"
                      min="1"
                    />
                  </div>
                  <Button type="submit" disabled={isCreating} className="w-full">
                    {isCreating ? 'Creating...' : 'Create Quiz'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {isTeacher && (
        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
                <DialogDescription>
                  Create a new quiz for your class. You can add questions after creating the quiz.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateQuiz} className="space-y-4">
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    placeholder="Enter quiz title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                    placeholder="Enter quiz description"
                  />
                </div>
                <div>
                  <Label htmlFor="timeLimit">Time Limit (minutes, optional)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={newQuiz.timeLimit}
                    onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: e.target.value })}
                    placeholder="Enter time limit in minutes"
                    min="1"
                  />
                </div>
                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? 'Creating...' : 'Create Quiz'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
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
    </div>
  )
} 