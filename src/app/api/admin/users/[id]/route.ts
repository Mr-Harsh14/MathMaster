import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

interface RouteParams {
  params: {
    id: string
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    const adminUser = await User.findOne({ email: session.user.email })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userToDelete = await User.findById(params.id)

    if (!userToDelete) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json(
        { message: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    await User.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 