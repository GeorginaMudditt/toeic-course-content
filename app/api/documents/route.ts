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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Document title is required' }, { status: 400 })
    }

    // Validate file type (PDFs and images)
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit (10MB)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `student-docs/${studentId}/${timestamp}-${random}-${sanitizedName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('resources')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('resources')
      .getPublicUrl(filename)

    const publicUrl = urlData.publicUrl

    // Create signed URL for better access control (optional, expires in 1 year)
    const expiresIn = 365 * 24 * 60 * 60 // 1 year in seconds
    const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
      .from('resources')
      .createSignedUrl(filename, expiresIn)

    const fileUrl = signedUrlData?.signedUrl || publicUrl

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
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
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
      await supabaseServer.storage.from('resources').remove([filename])
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
