import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

// Update avatar (can be emoji or image URL)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { avatar } = body

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar is required' }, { status: 400 })
    }

    // Validate: avatar should be either an emoji (single character or short string) or a URL
    const isEmoji = /^[\p{Emoji}\s]+$/u.test(avatar) && avatar.length <= 10
    const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://')

    if (!isEmoji && !isUrl) {
      return NextResponse.json(
        { error: 'Avatar must be either an emoji or a valid image URL' },
        { status: 400 }
      )
    }

    // Update user's avatar in database
    const { error: updateError } = await supabaseServer
      .from('User')
      .update({ avatar })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating user avatar:', updateError)
      return NextResponse.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar
    })
  } catch (error: any) {
    console.error('Error updating avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
