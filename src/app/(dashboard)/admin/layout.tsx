'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { redirect } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Check if we're still loading the session
    if (status === 'loading') return

    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
      return
    }

    // If authenticated but not admin, redirect to dashboard
    if (session?.user?.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  // Show nothing while loading or if not admin
  if (status === 'loading' || !session || session?.user?.role !== 'ADMIN') {
    return null
  }

  return <>{children}</>
} 