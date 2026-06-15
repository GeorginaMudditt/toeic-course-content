import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { isValidOnboardingChecklistSlug } from '@/lib/student-onboarding-checklist'

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: student, error: studentError } = await supabaseServer
      .from('User')
      .select('id')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const { itemSlug, fileName, mimeType, fileSize } = await request.json()

    if (!itemSlug || typeof itemSlug !== 'string' || !isValidOnboardingChecklistSlug(itemSlug)) {
      return NextResponse.json({ error: 'Invalid checklist item' }, { status: 400 })
    }

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'MIME type is required' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
        { status: 400 }
      )
    }

    if (typeof fileSize === 'number' && fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds limit (25MB)' },
        { status: 400 }
      )
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filePath = `student-onboarding/${params.id}/${itemSlug}/${timestamp}-${random}-${sanitizedName}`

    const { data, error } = await supabaseServer.storage
      .from('resources')
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      console.error('Error creating signed upload URL:', error)
      return NextResponse.json({ error: 'Failed to prepare upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      filePath,
      token: data.token,
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    })
  } catch (error) {
    console.error('Error in POST /api/students/[id]/onboarding-checklist/upload-url:', error)
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 })
  }
}
