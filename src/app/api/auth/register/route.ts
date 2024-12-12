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
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 400 }
        )
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('No user returned from auth signup')
    }

    console.log('Auth user created:', { id: authData.user.id, email: authData.user.email })

    // Now create the user profile in our users table
    const { data: user, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id, // Use the auth user id
          name,
          email,
          role,
        }
      ])
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    console.log('User profile created successfully:', { id: user.id, email: user.email, role: user.role })

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
    console.error("Registration error details:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Check for specific Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code
      if (code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        )
      }
      console.error('Supabase error code:', code)
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