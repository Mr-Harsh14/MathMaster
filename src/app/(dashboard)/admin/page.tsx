'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UsersIcon, KeyIcon, UserPlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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
      return
    }

    fetchUsers()
  }, [session, status])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (user.name?.toLowerCase() || '').includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  const handleCreateTeacher = async () => {
    try {
      const email = prompt('Enter teacher email:')
      const name = prompt('Enter teacher name:')
      const password = prompt('Enter teacher password:')
      
      if (!email || !password || !name) return

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: 'TEACHER' }),
      })

      if (!response.ok) throw new Error('Failed to create teacher')
      
      fetchUsers()
    } catch (err) {
      setError('Failed to create teacher')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')
      
      fetchUsers()
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:')
    if (!newPassword) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) throw new Error('Failed to reset password')
      alert('Password reset successful')
    } catch (err) {
      setError('Failed to reset password')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleCreateTeacher}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Create Teacher Account
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'TEACHER'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <KeyIcon className="h-5 w-5" />
                  </button>
                  {user.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  )
} 