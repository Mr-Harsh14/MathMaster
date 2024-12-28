import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(req: Request, { params }: RouteParams) {
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

    const { password } = await req.json()

    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      )
    }

    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password
    await User.findByIdAndUpdate(params.id, {
      password: hashedPassword
    })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 