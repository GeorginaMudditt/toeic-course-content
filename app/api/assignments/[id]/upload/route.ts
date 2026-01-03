import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify assignment belongs to student
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { enrollment: true }
    })

    if (!assignment || assignment.enrollment.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (only images and PDFs for writing responses)
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    
    if (!isImage && !isPDF) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File exceeds size limit (10MB)` },
        { status: 400 }
      )
    }

    // Generate unique filename with assignment ID prefix
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `assignment-${params.id}-${timestamp}-${random}-${sanitizedName}`

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

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

    return NextResponse.json({
      path: publicUrl,
      filename: file.name,
      type: file.type,
      size: file.size
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
