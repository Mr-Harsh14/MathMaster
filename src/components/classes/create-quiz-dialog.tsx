'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Question {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

export default function CreateQuizDialog({
  open,
  onClose,
  classId,
}: {
  open: boolean
  onClose: () => void
  classId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
    },
  ])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    // Validate questions
    const isValid = questions.every(
      (q) =>
        q.question.trim() !== '' &&
        q.options.every((opt) => opt.trim() !== '') &&
        q.answer.trim() !== ''
    )

    if (!isValid) {
      setError('Please fill in all required fields for each question')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/classes/${classId}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          questions,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create quiz')
      }

      router.refresh()
      onClose()
      setTitle('')
      setQuestions([
        {
          question: '',
          options: ['', '', '', ''],
          answer: '',
          explanation: '',
        },
      ])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleQuestionChange(index: number, field: keyof Question, value: string) {
    const newQuestions = [...questions]
    if (field === 'options') {
      // Handle options array separately
      return
    }
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  function handleOptionChange(questionIndex: number, optionIndex: number, value: string) {
    const newQuestions = [...questions]
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newQuestions[questionIndex].options.map((opt, idx) =>
        idx === optionIndex ? value : opt
      ),
    }
    setQuestions(newQuestions)
  }

  function addQuestion() {
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

  function removeQuestion(index: number) {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
            Create a New Quiz
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6">
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
                  placeholder="e.g., Chapter 1: Algebra Basics"
                />
              </div>

              {questions.map((question, questionIndex) => (
                <div key={questionIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h4>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question Text
                      </label>
                      <Input
                        type="text"
                        value={question.question}
                        onChange={(e) =>
                          handleQuestionChange(questionIndex, 'question', e.target.value)
                        }
                        required
                        className="mt-1"
                        placeholder="Enter your question"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      {question.options.map((option, optionIndex) => (
                        <Input
                          key={optionIndex}
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(questionIndex, optionIndex, e.target.value)
                          }
                          required
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Correct Answer
                      </label>
                      <select
                        value={question.answer}
                        onChange={(e) =>
                          handleQuestionChange(questionIndex, 'answer', e.target.value)
                        }
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select correct answer</option>
                        {question.options.map((option, index) => (
                          <option key={index} value={option}>
                            {option || `Option ${index + 1}`}
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
                        value={question.explanation}
                        onChange={(e) =>
                          handleQuestionChange(questionIndex, 'explanation', e.target.value)
                        }
                        className="mt-1"
                        placeholder="Explain why this is the correct answer"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addQuestion}
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Add Question
              </Button>
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