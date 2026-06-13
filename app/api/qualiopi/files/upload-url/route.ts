import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { getQualiopiFolder } from '@/lib/qualiopi-documents'

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { indicatorSlug, folderSlug, fileName, mimeType, fileSize } = await request.json()

    if (!indicatorSlug || !folderSlug) {
      return NextResponse.json({ error: 'Indicator and folder are required' }, { status: 400 })
    }

    const folder = getQualiopiFolder(indicatorSlug, folderSlug)
    if (!folder || folder.type !== 'pdf-folder') {
      return NextResponse.json({ error: 'Invalid Qualiopi folder' }, { status: 400 })
    }

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    if (mimeType !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (typeof fileSize === 'number' && fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds limit (25MB)' }, { status: 400 })
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filePath = `qualiopi/${indicatorSlug}/${folderSlug}/${timestamp}-${random}-${sanitizedName}`

    const { data, error } = await supabaseServer.storage
      .from('resources')
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      console.error('Error creating Qualiopi signed upload URL:', error)
      return NextResponse.json({ error: 'Failed to prepare upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      filePath,
      token: data.token,
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    })
  } catch (error) {
    console.error('Error in POST /api/qualiopi/files/upload-url:', error)
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 })
  }
}
