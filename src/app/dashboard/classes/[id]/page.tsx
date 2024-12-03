'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Tab } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PlusIcon } from '@heroicons/react/24/outline'
import StudentsList from '@/components/classes/students-list'
import QuizList from '@/components/classes/quiz-list'
import CreateQuizDialog from '@/components/classes/create-quiz-dialog'
import useClass from '@/hooks/use-class'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ClassPage() {
  const { data: session } = useSession()
  const params = useParams()
  const classId = params.id as string
  const isTeacher = session?.user?.role === 'TEACHER'
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)
  const { classData, loading, error } = useClass(classId)

  const tabs = [
    { name: 'Overview', component: <Overview classData={classData} /> },
    { name: 'Students', component: <StudentsList classId={classId} /> },
    { name: 'Quizzes', component: <QuizList classId={classId} /> },
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !classData) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Error loading class</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'Class not found'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {classData.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">Class Code: {classData.code}</p>
        </div>
        {isTeacher && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Button onClick={() => setIsCreateQuizOpen(true)}>
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Create Quiz
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  cn(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-4">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={cn(
                  'rounded-xl bg-white p-3',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      <CreateQuizDialog
        open={isCreateQuizOpen}
        onClose={() => setIsCreateQuizOpen(false)}
        classId={classId}
      />
    </div>
  )
}

function Overview({ classData }: { classData: any }) {
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === 'TEACHER'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            {isTeacher ? 'Total Students' : 'Classmates'}
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {classData._count.students}
          </dd>
        </div>
      </div>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Quizzes</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {classData._count.quizzes}
          </dd>
        </div>
      </div>
    </div>
  )
} 