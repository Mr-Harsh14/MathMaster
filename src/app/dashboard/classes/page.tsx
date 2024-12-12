'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import CreateClassDialog from '@/components/classes/create-class-dialog'
import JoinClassDialog from '@/components/classes/join-class-dialog'
import ClassList from '@/components/classes/class-list'

export default function ClassesPage() {
  const { data: session } = useSession()
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)

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

  if (isTeacher === null) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {isTeacher ? 'My Classes' : 'Enrolled Classes'}
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Button
            onClick={() => isTeacher ? setIsCreateOpen(true) : setIsJoinOpen(true)}
            className="ml-3"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            {isTeacher ? 'Create Class' : 'Join Class'}
          </Button>
        </div>
      </div>

      {/* Class List */}
      <div className="mt-8">
        <ClassList isTeacher={isTeacher} />
      </div>

      {/* Dialogs */}
      <CreateClassDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinClassDialog open={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  )
} 