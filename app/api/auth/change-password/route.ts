import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Get current user to verify password
    const { data: users, error: fetchError } = await supabaseServer
      .from('User')
      .select('id, password')
      .eq('id', session.user.id)
      .limit(1)

    if (fetchError || !users || users.length === 0) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabaseServer
      .from('User')
      .update({ password: hashedPassword })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error: any) {
    console.error('Error in change password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
