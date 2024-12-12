import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function POST(req: Request) {
  try {
    console.log('Starting registration process...')
    
    const body = await req.json()
    console.log('Received registration data:', { ...body, password: '[REDACTED]' })
    
    const { name, email, password, role } = body

    // Validate input
    if (!name || !email || !password || !role) {
      console.log('Missing required fields:', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasPassword: !!password, 
        hasRole: !!role 
      })
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      console.log('Invalid role:', role, 'Valid roles:', Object.values(UserRole))
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      )
    }

    console.log('Checking for existing user...')
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      )
    }

    console.log('Hashing password...')
    // Hash password
    const hashedPassword = await hash(password, 12)

    console.log('Creating user in database...')
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
      }
    })

    console.log('User created successfully:', { id: user.id, email: user.email, role: user.role })

    return NextResponse.json(
      {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      error
    })
    
    // Check for specific Prisma errors
    if (error?.name === 'PrismaClientKnownRequestError') {
      console.error('Prisma error code:', error?.code)
      // Handle specific Prisma errors
      if (error?.code === 'P2002') {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: "Something went wrong", 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.name || 'Unknown error type'
      },
      { status: 500 }
    )
  }
} 