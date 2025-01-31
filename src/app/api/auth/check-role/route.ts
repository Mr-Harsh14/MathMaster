import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { Types } from 'mongoose'

interface MongoDBUser {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  role: string;
  __v: number;
}

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { role: null },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email }).lean() as MongoDBUser

    if (!user) {
      return NextResponse.json(
        { role: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ role: user.role })
  } catch (error) {
    console.error('Error checking role:', error)
    return NextResponse.json(
      { message: 'Failed to check role' },
      { status: 500 }
    )
  }
} 