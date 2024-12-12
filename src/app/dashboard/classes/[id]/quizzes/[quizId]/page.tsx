'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline'
import EditQuizQuestions from '@/components/classes/edit-quiz-questions'

interface Question {
  id?: string
  question: string
  options: string[]
  answer: string
  explanation?: string | null
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
  timeLimit: number | null
  _count: {
    questions: number
    scores: number
  }
  alreadyTaken?: boolean
  score?: number
  maxScore?: number
  selectedAnswers?: string[]
  correctAnswers?: string[]
  explanations?: (string | null)[]
}

export default function QuizPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string
  const quizId = params.quizId as string
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([])
  const [explanations, setExplanations] = useState<(string | null)[]>([])
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    async function checkTeacherStatus() {
      try {
        const response = await fetch('/api/auth/check-role')
        if (!response.ok) {
          throw new Error('Failed to check role')
        }
        const data = await response.json()
        setIsTeacher(data.role === 'TEACHER')
      } catch (error) {
        console.error('Error checking role:', error)
        setIsTeacher(false)
      }
    }

    if (session?.user?.email) {
      checkTeacherStatus()
    }
  }, [session])

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/classes/${classId}/quizzes/${quizId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch quiz')
        }
        const data = await response.json()
        setQuiz(data)

        // If quiz was already taken, set the states accordingly
        if (data.alreadyTaken) {
          setSubmitted(true)
          setScore(data.score)
          setSelectedAnswers(data.selectedAnswers || [])
          setCorrectAnswers(data.correctAnswers || [])
          setExplanations(data.explanations || [])
        } else {
          // Initialize for new quiz attempt
          setSelectedAnswers(new Array(data.questions.length).fill(''))
          if (data.timeLimit) {
            setTimeRemaining(data.timeLimit * 60) // Convert minutes to seconds
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.email) {
      fetchQuiz()
    }
  }, [classId, quizId, session])

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || submitted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          if (prev === 1) handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, submitted])

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
      setCorrectAnswers(data.correctAnswers || [])
      setExplanations(data.explanations || [])

      // Refresh the page data
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit quiz')
    }
  }

  function handleAnswerSelect(answer: string) {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading || isTeacher === null) {
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
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/classes/${classId}`)}
          className="mt-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Class
        </Button>
      </div>
    )
  }

  if (isTeacher && (isEditing || quiz.questions.length === 0)) {
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
        </div>

        <EditQuizQuestions
          classId={classId}
          quizId={quizId}
          initialQuestions={quiz.questions}
          onSave={() => {
            setIsEditing(false)
            router.refresh()
          }}
        />
      </div>
    )
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/classes/${classId}`)}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Class
        </Button>
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No questions available</h3>
          <p className="mt-1 text-sm text-gray-500">This quiz has no questions yet.</p>
          {isTeacher && (
            <Button
              onClick={() => setIsEditing(true)}
              className="mt-4"
            >
              Add Questions
            </Button>
          )}
        </div>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            {!submitted && (
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            )}
          </div>
          {timeRemaining !== null && !submitted && (
            <div className="flex items-center text-sm font-medium">
              <ClockIcon className="h-5 w-5 mr-1 text-gray-500" />
              <span className={timeRemaining < 60 ? 'text-red-600' : 'text-gray-900'}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          {isTeacher && !submitted && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit Questions
            </Button>
          )}
        </div>
      </div>

      {submitted ? (
        <div className="space-y-6">
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

          <div className="bg-white shadow sm:rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Answers</h3>
            <div className="space-y-8">
              {quiz.questions.map((question, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0">
                  <p className="font-medium text-gray-900 mb-4">
                    {index + 1}. {question.question}
                  </p>
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-lg ${
                          option === correctAnswers[index]
                            ? 'bg-green-50 border border-green-200'
                            : option === selectedAnswers[index] && option !== correctAnswers[index]
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm text-gray-900">{option}</p>
                      </div>
                    ))}
                  </div>
                  {explanations[index] && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Explanation: </span>
                        {explanations[index]}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
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