'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

interface Question {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface CreateQuizDialogProps {
  open: boolean
  onClose: () => void
  classId: string
}

export default function CreateQuizDialog({
  open,
  onClose,
  classId,
}: CreateQuizDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [timeLimit, setTimeLimit] = useState<number>(30)
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
    },
  ])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/classes/${classId}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          questions,
          timeLimit,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create quiz')
      }

      // Reset form
      setTitle('')
      setTimeLimit(30)
      setQuestions([
        {
          question: '',
          options: ['', '', '', ''],
          answer: '',
          explanation: '',
        },
      ])

      // Close dialog and refresh the page
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Error creating quiz:', error)
      setError(error instanceof Error ? error.message : 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionChange = (index: number, field: keyof Question, value: string | string[]) => {
    const newQuestions = [...questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    }
    setQuestions(newQuestions)
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        answer: '',
        explanation: '',
      },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
            Create a New Quiz
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Quiz Title
                </label>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                  Time Limit (minutes)
                </label>
                <Input
                  type="number"
                  id="timeLimit"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  min="1"
                  max="180"
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-6">
                {questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Question {questionIndex + 1}</h3>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Question Text
                        </label>
                        <Input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Options
                        </label>
                        <div className="mt-1 space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <Input
                              key={optionIndex}
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options]
                                newOptions[optionIndex] = e.target.value
                                handleQuestionChange(questionIndex, 'options', newOptions)
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                              required
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Correct Answer
                        </label>
                        <select
                          value={question.answer}
                          onChange={(e) => handleQuestionChange(questionIndex, 'answer', e.target.value)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select correct answer</option>
                          {question.options.map((option, index) => (
                            <option key={index} value={option} disabled={!option}>
                              {option || `Option ${index + 1} (empty)`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Explanation (Optional)
                        </label>
                        <Input
                          type="text"
                          value={question.explanation || ''}
                          onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full"
                >
                  Add Question
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Quiz'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 