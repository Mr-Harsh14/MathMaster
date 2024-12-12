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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        },
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/login`
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      )
    }

    // The user profile will be created automatically by the database trigger
    console.log('User registration successful:', { 
      id: authData.user.id, 
      email: authData.user.email,
      role: role
    })

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          name,
          email,
          role,
        }
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Registration error details:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { 
        message: "Registration failed", 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 