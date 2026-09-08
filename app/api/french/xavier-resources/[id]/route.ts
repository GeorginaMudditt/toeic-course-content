import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  loadXavierResources,
  saveXavierResources,
  XAVIER_STORAGE_BUCKET,
} from '@/lib/french-xavier-resources'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = decodeURIComponent(params.id).trim()
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const resources = await loadXavierResources()
    const existing = resources.find((item) => item.id === id)

    if (!existing) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    await saveXavierResources(resources.filter((item) => item.id !== id))

    if (existing.file_path) {
      const { error: storageError } = await supabaseServer.storage
        .from(XAVIER_STORAGE_BUCKET)
        .remove([existing.file_path])
      if (storageError) {
        console.error('Error deleting Xavier PDF from storage:', storageError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/french/xavier-resources/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
}
