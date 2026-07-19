import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import {
  WRITING_ALLOWED_MIME_TYPES,
  WRITING_MAX_UPLOAD_BYTES,
} from '@/lib/writing-submissions'

async function assertStudentExists(studentId: string) {
  const { data, error } = await supabaseServer
    .from('User')
    .select('id, role')
    .eq('id', studentId)
    .eq('role', 'STUDENT')
    .limit(1)

  if (error) {
    console.error('Error checking student:', error)
    return false
  }
  return !!(data && data.length > 0)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentIdParam = searchParams.get('studentId')
    const status = searchParams.get('status')

    let studentId: string
    if (session.user.role === 'TEACHER') {
      if (!studentIdParam) {
        return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
      }
      studentId = studentIdParam
    } else if (session.user.role === 'STUDENT') {
      studentId = session.user.id
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabaseServer
      .from('WritingSubmission')
      .select('*')
      .eq('studentId', studentId)
      .order('submittedAt', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error listing writing submissions:', error)
      return NextResponse.json({ error: 'Failed to load writing submissions' }, { status: 500 })
    }

    return NextResponse.json({ submissions: data || [] })
  } catch (error) {
    console.error('Error in GET /api/writing-submissions:', error)
    return NextResponse.json({ error: 'Failed to load writing submissions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const originalText = typeof body.originalText === 'string' ? body.originalText.trim() : ''
    const filePath = typeof body.filePath === 'string' ? body.filePath : null
    const fileName = typeof body.fileName === 'string' ? body.fileName : null
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : null
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : null

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!originalText && !filePath) {
      return NextResponse.json(
        { error: 'Please provide typed writing and/or a file upload' },
        { status: 400 }
      )
    }

    let studentId: string
    let uploadedById: string | null = null

    if (session.user.role === 'TEACHER') {
      studentId = typeof body.studentId === 'string' ? body.studentId : ''
      if (!studentId) {
        return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
      }
      const exists = await assertStudentExists(studentId)
      if (!exists) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
      uploadedById = session.user.id
    } else {
      studentId = session.user.id
    }

    let fileUrl: string | null = null

    if (filePath) {
      if (!fileName || !mimeType) {
        return NextResponse.json({ error: 'File metadata is incomplete' }, { status: 400 })
      }
      if (!(WRITING_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
          { status: 400 }
        )
      }
      if (fileSize != null && fileSize > WRITING_MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'File size exceeds limit (10MB)' }, { status: 400 })
      }
      if (!filePath.startsWith(`writing-submissions/${studentId}/`)) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
      }

      const expiresIn = 365 * 24 * 60 * 60
      const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
        .from('resources')
        .createSignedUrl(filePath, expiresIn)

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Error creating signed URL for writing file:', signedUrlError)
        return NextResponse.json({ error: 'Uploaded file not found in storage' }, { status: 400 })
      }
      fileUrl = signedUrlData.signedUrl
    }

    const now = new Date().toISOString()
    const id = randomUUID()

    const { data, error } = await supabaseServer
      .from('WritingSubmission')
      .insert({
        id,
        studentId,
        title,
        originalText,
        fileUrl,
        fileName,
        mimeType,
        fileSize,
        status: 'SUBMITTED',
        submittedAt: now,
        uploadedById,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating writing submission:', error)
      return NextResponse.json(
        { error: `Failed to save submission: ${error.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, submission: data })
  } catch (error) {
    console.error('Error in POST /api/writing-submissions:', error)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }
}
