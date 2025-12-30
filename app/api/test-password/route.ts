import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const testEmail = 'hello@brizzle-english.com'
    const testPassword = 'X-press129'
    
    // Find the user
    const { data: users, error: findError } = await supabaseServer
      .from('User')
      .select('id, email, password, name, role')
      .eq('email', testEmail)
      .limit(1)

    if (findError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to find user',
        details: findError
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: testEmail
      }, { status: 404 })
    }

    const user = users[0]
    
    // Try to verify the password
    let passwordMatch = false
    let passwordError = null
    try {
      passwordMatch = await bcrypt.compare(testPassword, user.password)
    } catch (error: any) {
      passwordError = error.message || String(error)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHashLength: user.password.length,
        passwordHashPreview: user.password.substring(0, 20) + '...'
      },
      passwordCheck: {
        match: passwordMatch,
        error: passwordError,
        testPassword: testPassword
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack
    }, { status: 500 })
  }
}
