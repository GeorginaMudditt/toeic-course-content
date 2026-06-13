import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: file, error: fetchError } = await supabaseServer
      .from('QualiopiFile')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (file.uploadedBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteStorageError } = await supabaseServer.storage
      .from('resources')
      .remove([file.filePath])

    if (deleteStorageError) {
      console.error('Error deleting Qualiopi file from storage:', deleteStorageError)
    }

    const { error: dbError } = await supabaseServer
      .from('QualiopiFile')
      .delete()
      .eq('id', params.id)

    if (dbError) {
      console.error('Error deleting Qualiopi file record:', dbError)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/qualiopi/files/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
