import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { isMissingStudentNoteColumn } from '@/lib/student-document-checklist'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentNote } = await request.json()

    if (studentNote !== undefined && typeof studentNote !== 'string') {
      return NextResponse.json({ error: 'Invalid student note' }, { status: 400 })
    }

    const { data: document, error: fetchError } = await supabaseServer
      .from('StudentDocument')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const trimmedNote = typeof studentNote === 'string' ? studentNote.trim() : ''
    const now = new Date().toISOString()

    const { data: updatedDocument, error: updateError } = await supabaseServer
      .from('StudentDocument')
      .update({
        studentNote: trimmedNote || null,
        updatedAt: now,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      if (isMissingStudentNoteColumn(updateError)) {
        return NextResponse.json(
          {
            error:
              'Student notes are not enabled yet. Run supabase-migration-student-document-note.sql in Supabase.',
          },
          { status: 500 }
        )
      }

      console.error('Error updating document note:', updateError)
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
    }

    return NextResponse.json({ success: true, document: updatedDocument })
  } catch (error) {
    console.error('Error in PATCH /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch document to get file path
    const { data: document, error: fetchError } = await supabaseServer
      .from('StudentDocument')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify teacher uploaded this document (or is admin)
    if (document.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract storage object path from signed/public URLs.
    // We store documents under student-docs/<studentId>/...
    const fileUrl = decodeURIComponent(document.fileUrl || '')
    const pathMatch = fileUrl.match(/(student-docs\/[^?]+)/)
    const filePath = pathMatch ? pathMatch[1] : null

    // Delete file from storage if path can be extracted
    if (filePath) {
      const { error: deleteError } = await supabaseServer.storage
        .from('resources')
        .remove([filePath])

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete document record from database
    const { error: dbError } = await supabaseServer
      .from('StudentDocument')
      .delete()
      .eq('id', params.id)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
