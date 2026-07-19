import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  WRITING_ALLOWED_MIME_TYPES,
  WRITING_MAX_UPLOAD_BYTES,
} from '@/lib/writing-submissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId: bodyStudentId, fileName, mimeType, fileSize } = await request.json()

    let studentId: string
    if (session.user.role === 'TEACHER') {
      if (!bodyStudentId || typeof bodyStudentId !== 'string') {
        return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
      }
      studentId = bodyStudentId
    } else {
      studentId = session.user.id
    }

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'MIME type is required' }, { status: 400 })
    }

    if (!(WRITING_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
        { status: 400 }
      )
    }

    if (typeof fileSize === 'number' && fileSize > WRITING_MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File size exceeds limit (10MB)' }, { status: 400 })
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filePath = `writing-submissions/${studentId}/${timestamp}-${random}-${sanitizedName}`

    const { data, error } = await supabaseServer.storage
      .from('resources')
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      console.error('Error creating writing upload URL:', error)
      return NextResponse.json({ error: 'Failed to prepare upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      filePath,
      token: data.token,
      maxSizeBytes: WRITING_MAX_UPLOAD_BYTES,
    })
  } catch (error) {
    console.error('Error in POST /api/writing-submissions/upload-url:', error)
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 })
  }
}
