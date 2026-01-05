import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user by reset token
    // Note: PostgREST requires .order() before .limit()
    const { data: users, error: fetchError } = await supabaseServer
      .from('User')
      .select('id, resetToken, resetTokenExpiry')
      .eq('resetToken', token)
      .order('updatedAt', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const user = users[0]

    // Check if token has expired
    if (!user.resetTokenExpiry) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const expiryDate = new Date(user.resetTokenExpiry)
    if (expiryDate < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password, clear reset token, and update timestamp
    // Use camelCase 'updatedAt' like the Resource route does (which works)
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseServer
      .from('User')
      .update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: now  // Use camelCase as schema defines it
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })
  } catch (error: any) {
    console.error('Error in reset password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
