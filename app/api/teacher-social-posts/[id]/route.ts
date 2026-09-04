import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  isTeacherSocialPostStatus,
  plannedDateToIso,
} from '@/lib/teacher-social-posts'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (body.title !== undefined) {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      if (!title) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      updatePayload.title = title
    }

    if (body.plannedDate !== undefined) {
      const plannedDateIso =
        typeof body.plannedDate === 'string' ? plannedDateToIso(body.plannedDate) : null
      if (!plannedDateIso) {
        return NextResponse.json({ error: 'A valid planned date is required' }, { status: 400 })
      }
      updatePayload.plannedDate = plannedDateIso
    }

    if (body.status !== undefined) {
      if (!isTeacherSocialPostStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updatePayload.status = body.status
      updatePayload.completedAt = body.status === 'DONE' ? new Date().toISOString() : null
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('TeacherSocialPost')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('teacherId', session.user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating teacher social post:', error)
      return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Social post not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/teacher-social-posts/[id]:', error)
    return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseServer
      .from('TeacherSocialPost')
      .delete()
      .eq('id', params.id)
      .eq('teacherId', session.user.id)

    if (error) {
      console.error('Error deleting teacher social post:', error)
      return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/teacher-social-posts/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 })
  }
}
