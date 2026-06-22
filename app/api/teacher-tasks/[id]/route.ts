import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { isTeacherTaskStatus } from '@/lib/teacher-tasks'

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

    if (body.status !== undefined) {
      if (!isTeacherTaskStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updatePayload.status = body.status
      updatePayload.completedAt = body.status === 'DONE' ? new Date().toISOString() : null
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('TeacherTask')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('teacherId', session.user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating teacher task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/teacher-tasks/[id]:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
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
      .from('TeacherTask')
      .delete()
      .eq('id', params.id)
      .eq('teacherId', session.user.id)

    if (error) {
      console.error('Error deleting teacher task:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/teacher-tasks/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
