import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow creating users without auth for initial setup, or require teacher auth
    const data = await request.json()
    
    if (session && session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate input
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (data.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = data.email.toLowerCase().trim()

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabaseServer
      .from('User')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Failed to check if user exists' },
        { status: 500 }
      )
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const { data: newUser, error: createError } = await supabaseServer
      .from('User')
      .insert({
        name: data.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: data.role || 'STUDENT'
      })
      .select('id, email, name, role, createdAt, updatedAt')
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      
      // Check for unique constraint violation
      if (createError.code === '23505' || createError.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to create user: ${createError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user: No data returned' },
        { status: 500 }
      )
    }

    // Don't return password
    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error('Error in POST /api/users:', error)
    return NextResponse.json(
      { error: `Failed to create user: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}


