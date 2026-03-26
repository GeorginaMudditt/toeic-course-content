import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    const { studentId, title, fileName, filePath, fileSize, mimeType } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Document title is required' }, { status: 400 })
    }

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 })
    }

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'MIME type is required' }, { status: 400 })
    }

    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json({ error: 'Valid file size is required' }, { status: 400 })
    }

    // Validate file type (PDFs and images)
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
        { status: 400 }
      )
    }

    const maxSize = 25 * 1024 * 1024 // 25MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit (25MB)' },
        { status: 400 }
      )
    }

    // Create signed URL for better access control (optional, expires in 1 year)
    const expiresIn = 365 * 24 * 60 * 60 // 1 year in seconds
    const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
      .from('resources')
      .createSignedUrl(filePath, expiresIn)

    if (signedUrlError) {
      console.error('Error creating signed URL for uploaded document:', signedUrlError)
      return NextResponse.json({ error: 'Uploaded file not found in storage' }, { status: 400 })
    }

    const fileUrl = signedUrlData?.signedUrl

    // Generate ID and timestamps (Supabase doesn't auto-generate like Prisma)
    const documentId = randomUUID()
    const now = new Date().toISOString()

    // Save document record to database
    const { data: documentData, error: dbError } = await supabaseServer
      .from('StudentDocument')
      .insert({
        id: documentId,
        studentId,
        title: title.trim(),
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        uploadedBy: session.user.id,
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      console.error('Database error details:', JSON.stringify(dbError, null, 2))
      // Try to delete uploaded file if database insert fails
      await supabaseServer.storage.from('resources').remove([filePath])
      return NextResponse.json(
        { error: `Failed to save document record: ${dbError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: documentData
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
