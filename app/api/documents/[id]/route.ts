import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

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

    // Extract file path from URL (remove domain and bucket info)
    const fileUrl = document.fileUrl
    const urlParts = fileUrl.split('/resources/')
    const filePath = urlParts.length > 1 ? `student-docs/${document.studentId}/${urlParts[1].split('?')[0]}` : null

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
