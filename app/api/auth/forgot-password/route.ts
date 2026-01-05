import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
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
        // In a production environment, you would send an email here
        // For now, we'll return the token in the response (only for development)
        // In production, remove this and send via email
        console.log('Password reset token for', email, ':', resetToken)
        console.log('Reset URL:', `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`)
        
        // TODO: Send email with reset link
        // Example: await sendEmail({
        //   to: user.email,
        //   subject: 'Password Reset Request',
        //   html: `Click here to reset your password: ${resetUrl}`
        // })
      }
    }

    // Always return success to prevent email enumeration
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
