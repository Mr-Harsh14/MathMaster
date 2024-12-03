'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Question {
  id: string
  question: string
  options: string[]
  explanation?: string
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
  _count: {
    questions: number
    scores: number
  }
  highestScore?: number
  maxScore?: number
}

export default function QuizPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string
  const quizId = params.quizId as string
  const isTeacher = session?.user?.role === 'TEACHER'

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/classes/${classId}/quizzes/${quizId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch quiz')
        }
        const data = await response.json()
        setQuiz(data)
        setSelectedAnswers(new Array(data.questions.length).fill(''))
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [classId, quizId])

  async function handleSubmit() {
    if (!quiz) return

    try {
      const response = await fetch(`/api/classes/${classId}/quizzes/${quizId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: selectedAnswers,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit quiz')
      }

      const data = await response.json()
      setScore(data.score)
      setSubmitted(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit quiz')
    }
  }

  function handleAnswerSelect(answer: string) {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading quiz</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Quiz not found'}</p>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/classes/${classId}`)}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Class
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
        {!submitted && (
          <p className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        )}
      </div>

      {submitted ? (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quiz Results</h2>
          <p className="text-lg mb-6">
            Your score: {score} out of {quiz.questions.length} (
            {Math.round((score! / quiz.questions.length) * 100)}%)
          </p>
          <Button onClick={() => router.push(`/dashboard/classes/${classId}`)}>
            Return to Class
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.question}
          </h3>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="answer"
                  value={option}
                  checked={selectedAnswers[currentQuestionIndex] === option}
                  onChange={() => handleAnswerSelect(option)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label
                  htmlFor={`option-${index}`}
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedAnswers.some((answer) => !answer)}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={!selectedAnswers[currentQuestionIndex]}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 