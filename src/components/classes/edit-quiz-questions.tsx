'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Question {
  id?: string
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface EditQuizQuestionsProps {
  classId: string
  quizId: string
  initialQuestions?: Question[]
  onSave?: () => void
}

export default function EditQuizQuestions({
  classId,
  quizId,
  initialQuestions = [],
  onSave,
}: EditQuizQuestionsProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', ''],
        answer: '',
      },
    ])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    }
    setQuestions(newQuestions)
  }

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options.push('')
    setQuestions(newQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex] = value
    setQuestions(newQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    )
    setQuestions(newQuestions)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      setShowSuccess(false)

      const response = await fetch(`/api/classes/${classId}/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save questions')
      }

      // Show success message
      setShowSuccess(true)

      // Refresh the page data
      router.refresh()

      // Call onSave callback after a delay to allow the success message to be seen
      setTimeout(() => {
        onSave?.()
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save questions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">Questions saved successfully!</p>
          </div>
        </div>
      )}

      {questions.map((question, questionIndex) => (
        <div
          key={questionIndex}
          className="border border-gray-200 rounded-lg p-6 space-y-4"
        >
          <div className="flex justify-between items-start">
            <Label className="text-lg font-medium">
              Question {questionIndex + 1}
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeQuestion(questionIndex)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor={`question-${questionIndex}`}>Question Text</Label>
              <Textarea
                id={`question-${questionIndex}`}
                value={question.question}
                onChange={(e) =>
                  updateQuestion(questionIndex, 'question', e.target.value)
                }
                placeholder="Enter your question"
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) =>
                      updateOption(questionIndex, optionIndex, e.target.value)
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(questionIndex, optionIndex)}
                    disabled={question.options.length <= 2}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(questionIndex)}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div>
              <Label htmlFor={`answer-${questionIndex}`}>Correct Answer</Label>
              <select
                id={`answer-${questionIndex}`}
                value={question.answer}
                onChange={(e) =>
                  updateQuestion(questionIndex, 'answer', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select correct answer</option>
                {question.options.map((option, optionIndex) => (
                  <option key={optionIndex} value={option}>
                    {option || `Option ${optionIndex + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor={`explanation-${questionIndex}`}>
                Explanation (Optional)
              </Label>
              <Textarea
                id={`explanation-${questionIndex}`}
                value={question.explanation || ''}
                onChange={(e) =>
                  updateQuestion(questionIndex, 'explanation', e.target.value)
                }
                placeholder="Explain why this is the correct answer"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={addQuestion}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Question
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || questions.length === 0}
        >
          {loading ? 'Saving...' : 'Save Questions'}
        </Button>
      </div>
    </div>
  )
} 