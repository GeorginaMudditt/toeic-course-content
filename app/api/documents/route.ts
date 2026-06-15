import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import {
  getDocumentTitleForChecklistSlug,
  isMissingChecklistItemSlugColumn,
  isMissingStudentNoteColumn,
} from '@/lib/student-document-checklist'
import {
  getChecklistItemDefinition,
  isDocumentLinkedChecklistType,
  isDualDocumentOrNaType,
} from '@/lib/student-onboarding-checklist'

async function deleteDocumentRecord(document: {
  id: string
  fileUrl: string | null
}) {
  const fileUrl = decodeURIComponent(document.fileUrl || '')
  const pathMatch = fileUrl.match(/(student-docs\/[^?]+)/)
  const filePath = pathMatch ? pathMatch[1] : null

  if (filePath) {
    const { error: deleteError } = await supabaseServer.storage
      .from('resources')
      .remove([filePath])

    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError)
    }
  }

  const { error: dbError } = await supabaseServer
    .from('StudentDocument')
    .delete()
    .eq('id', document.id)

  if (dbError) {
    throw dbError
  }
}

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

    const {
      studentId,
      title,
      fileName,
      filePath,
      fileSize,
      mimeType,
      checklistItemSlug,
      checklistDocumentKey,
    } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    let resolvedTitle = typeof title === 'string' ? title.trim() : ''
    let isDualDocumentUpload = false

    if (checklistItemSlug) {
      const checklistItem = getChecklistItemDefinition(checklistItemSlug)
      const isLinkedUpload =
        checklistItem &&
        (isDocumentLinkedChecklistType(checklistItem.type) ||
          isDualDocumentOrNaType(checklistItem.type))

      if (!isLinkedUpload) {
        return NextResponse.json({ error: 'Invalid checklist item for document upload' }, { status: 400 })
      }

      if (isDualDocumentOrNaType(checklistItem.type)) {
        if (!checklistDocumentKey || typeof checklistDocumentKey !== 'string') {
          return NextResponse.json({ error: 'Document slot is required' }, { status: 400 })
        }

        const slotTitle = getDocumentTitleForChecklistSlug(
          checklistItemSlug,
          checklistDocumentKey
        )
        if (!slotTitle) {
          return NextResponse.json({ error: 'Invalid document slot' }, { status: 400 })
        }

        resolvedTitle = slotTitle
        isDualDocumentUpload = true
      } else {
        resolvedTitle = checklistItem.documentTitle || resolvedTitle
      }

      const allowedTypes = checklistItem.allowedMimeTypes ?? [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
      ]
      if (!mimeType || typeof mimeType !== 'string' || !allowedTypes.includes(mimeType)) {
        return NextResponse.json(
          { error: 'Invalid file type for this checklist item' },
          { status: 400 }
        )
      }
    }

    if (!resolvedTitle) {
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

    if (!checklistItemSlug) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(mimeType)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
          { status: 400 }
        )
      }
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

    let preservedStudentNote: string | null = null

    if (checklistItemSlug) {
      const checklistTitle =
        getDocumentTitleForChecklistSlug(
          checklistItemSlug,
          isDualDocumentUpload ? checklistDocumentKey : undefined
        ) || resolvedTitle

      let existingQuery = supabaseServer
        .from('StudentDocument')
        .select('id, fileUrl, studentNote, title')
        .eq('studentId', studentId)
        .eq('checklistItemSlug', checklistItemSlug)

      if (isDualDocumentUpload) {
        existingQuery = existingQuery.eq('title', checklistTitle)
      }

      const { data: existingBySlug, error: existingBySlugError } = await existingQuery

      let existingDocuments: Array<{
        id: string
        fileUrl: string | null
        studentNote?: string | null
        title?: string
      }> | null = existingBySlug

      if (existingBySlugError) {
        if (!isMissingChecklistItemSlugColumn(existingBySlugError)) {
          console.error('Error checking existing checklist document:', existingBySlugError)
          return NextResponse.json({ error: 'Failed to prepare document upload' }, { status: 500 })
        }

        let titleQuery = supabaseServer
          .from('StudentDocument')
          .select('id, fileUrl, studentNote, title')
          .eq('studentId', studentId)
          .eq('title', checklistTitle)

        const { data: existingByTitle, error: existingByTitleError } = await titleQuery

        if (existingByTitleError && !isMissingStudentNoteColumn(existingByTitleError)) {
          console.error('Error checking existing checklist document by title:', existingByTitleError)
          return NextResponse.json({ error: 'Failed to prepare document upload' }, { status: 500 })
        }

        if (existingByTitleError && isMissingStudentNoteColumn(existingByTitleError)) {
          const { data: existingByTitleBasic, error: basicError } = await supabaseServer
            .from('StudentDocument')
            .select('id, fileUrl')
            .eq('studentId', studentId)
            .eq('title', checklistTitle)

          if (basicError) {
            console.error('Error checking existing checklist document by title:', basicError)
            return NextResponse.json({ error: 'Failed to prepare document upload' }, { status: 500 })
          }

          existingDocuments = existingByTitleBasic || []
        } else {
          existingDocuments = existingByTitle
        }
      }

      for (const existing of existingDocuments || []) {
        if (typeof (existing as { studentNote?: string | null }).studentNote === 'string') {
          preservedStudentNote = (existing as { studentNote: string }).studentNote
        }
        try {
          await deleteDocumentRecord(existing)
        } catch (deleteError) {
          console.error('Error replacing existing checklist document:', deleteError)
          return NextResponse.json({ error: 'Failed to replace existing document' }, { status: 500 })
        }
      }
    }

    // Generate ID and timestamps (Supabase doesn't auto-generate like Prisma)
    const documentId = randomUUID()
    const now = new Date().toISOString()

    const baseInsert: Record<string, unknown> = {
      id: documentId,
      studentId,
      title: resolvedTitle,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      uploadedBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    if (preservedStudentNote) {
      baseInsert.studentNote = preservedStudentNote
    }

    // Save document record to database
    let documentData
    let dbError

    if (checklistItemSlug) {
      const withSlug = await supabaseServer
        .from('StudentDocument')
        .insert({
          ...baseInsert,
          checklistItemSlug,
        })
        .select()
        .single()

      documentData = withSlug.data
      dbError = withSlug.error

      if (dbError && isMissingChecklistItemSlugColumn(dbError)) {
        const withoutSlug = await supabaseServer
          .from('StudentDocument')
          .insert(baseInsert)
          .select()
          .single()

        documentData = withoutSlug.data
        dbError = withoutSlug.error
      }
    } else {
      const result = await supabaseServer.from('StudentDocument').insert(baseInsert).select().single()
      documentData = result.data
      dbError = result.error
    }

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

    if (isDualDocumentUpload && checklistItemSlug) {
      await supabaseServer
        .from('StudentOnboardingChecklistItem')
        .delete()
        .eq('studentId', studentId)
        .eq('itemSlug', checklistItemSlug)
        .eq('status', 'NOT_APPLICABLE')
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
