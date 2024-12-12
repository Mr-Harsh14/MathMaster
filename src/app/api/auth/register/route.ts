import { hash } from "bcryptjs"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

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
    if (!['STUDENT', 'TEACHER'].includes(role)) {
      console.log('Invalid role:', role, 'Valid roles:', ['STUDENT', 'TEACHER'])
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      )
    }

    console.log('Checking for existing user...')
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

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
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      throw error
    }

    if (!user) {
      throw new Error('Failed to create user')
    }

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
  } catch (error: unknown) {
    console.error("Registration error details:", error)

    // Check for Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: "Something went wrong", 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 