import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

// GET /api/admin/users - Get all users
export async function GET() {
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

    const users = await User.find({}, '-password').lean()

    return NextResponse.json(users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    })))
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create a new user (teacher)
export async function POST(req: Request) {
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

    const { email, password, name, role } = await req.json()

    if (!email || !password || !name || !role || role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Invalid input' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    })

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    )
  }
} 