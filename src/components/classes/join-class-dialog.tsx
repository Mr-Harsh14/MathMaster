'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

export default function JoinClassDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const code = formData.get('code') as string

    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join class')
      }

      // Close dialog and refresh data
      onClose()
      router.refresh()
      
      // Invalidate and refetch data
      const refreshResponse = await fetch('/api/classes', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (refreshResponse.ok) {
        router.refresh()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
            Join a Class
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="mt-4">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Class Code
                </label>
                <Input
                  type="text"
                  name="code"
                  id="code"
                  required
                  className="mt-1"
                  placeholder="Enter class code"
                />
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
                {loading ? 'Joining...' : 'Join Class'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 