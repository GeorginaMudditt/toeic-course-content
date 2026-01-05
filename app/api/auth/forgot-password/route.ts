import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: users, error: fetchError } = await supabaseServer
      .from('User')
      .select('id, email, name')
      .eq('email', email.toLowerCase().trim())
      .limit(1)

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json(
        { error: 'Error processing request' },
        { status: 500 }
      )
    }

    // Always return success to prevent email enumeration
    // But only generate token if user exists
    if (users && users.length > 0) {
      const user = users[0]
      console.log('📧 User found, preparing to send password reset email to:', user.email)
      
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date()
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Token expires in 1 hour

      // Save token to database
      const { error: updateError } = await supabaseServer
        .from('User')
        .update({
          resetToken,
          resetTokenExpiry: resetTokenExpiry.toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error saving reset token:', updateError)
        // Still return success to prevent email enumeration
      } else {
        // Send password reset email
        const emailResult = await sendPasswordResetEmail({
          userEmail: user.email,
          userName: user.name,
          resetToken
        })

        if (emailResult.error) {
          console.error('❌ Error sending password reset email:', emailResult.error)
          console.error('Error details:', emailResult.details)
          // Still return success to prevent email enumeration
          // Log the token for manual recovery if needed (development only)
          if (process.env.NODE_ENV === 'development') {
            console.log('🔑 Password reset token for', email, ':', resetToken)
            console.log('🔗 Reset URL:', `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`)
          }
        } else {
          console.log('✅ Password reset email sent successfully to:', user.email)
        }
      }
    }

    // Always return success to prevent email enumeration
    if (users && users.length === 0) {
      console.log('ℹ️  User not found for email:', email, '- returning success message anyway')
    }
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error: any) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
