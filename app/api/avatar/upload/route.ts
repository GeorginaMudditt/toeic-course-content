import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (only images)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (PNG, JPEG, GIF, WebP) are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB for avatars)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit (2MB)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${random}-${sanitizedName}`
    const filePath = `avatars/${session.user.id}/${filename}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage (create avatars bucket if needed)
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true // Allow overwriting existing avatar
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload avatar: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update user's avatar in database
    const { error: updateError } = await supabaseServer
      .from('User')
      .update({ avatar: publicUrl })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating user avatar:', updateError)
      return NextResponse.json(
        { error: 'Failed to update avatar in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      path: publicUrl,
      filename: filename
    })
  } catch (error: any) {
    console.error('Error in avatar upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
