import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  MAX_STUDENT_PDF_BYTES,
  isPdfUpload,
  studentPdfStoragePrefix,
} from '@/lib/student-uploaded-resource'
import { verifyTeacherEnrollment } from '@/lib/verify-teacher-enrollment'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const enrollmentId = String(body.enrollmentId || '').trim()
    const fileName = String(body.fileName || '').trim()
    const mimeType = String(body.mimeType || '')
    const fileSize = Number(body.fileSize)

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Choose a course for this document.' }, { status: 400 })
    }
    if (!isPdfUpload(fileName, mimeType)) {
      return NextResponse.json({ error: 'Only PDF files can be uploaded here.' }, { status: 400 })
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: 'Choose a PDF to upload.' }, { status: 400 })
    }
    if (fileSize > MAX_STUDENT_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF must be 10MB or smaller.' }, { status: 400 })
    }

    const enrollment = await verifyTeacherEnrollment(enrollmentId, session.user.id)
    if (!enrollment.ok) {
      return NextResponse.json({ error: enrollment.error }, { status: enrollment.status })
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filePath = `${studentPdfStoragePrefix(enrollmentId)}${timestamp}-${random}-${sanitizedName}`

    const { data, error } = await supabaseServer.storage
      .from('resources')
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      console.error('Error creating student PDF upload URL:', error)
      return NextResponse.json(
        { error: error?.message || 'Failed to prepare the upload.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ filePath, token: data.token })
  } catch (error) {
    console.error('Error preparing student PDF upload:', error)
    const message = error instanceof Error ? error.message : 'Failed to prepare the upload.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
