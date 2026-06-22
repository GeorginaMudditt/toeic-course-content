import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const orderedIds = body.orderedIds

    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json({ error: 'orderedIds must be an array of task ids' }, { status: 400 })
    }

    const { data: openTasks, error: fetchError } = await supabaseServer
      .from('TeacherTask')
      .select('id')
      .eq('teacherId', session.user.id)
      .eq('status', 'OPEN')

    if (fetchError) {
      console.error('Error fetching open tasks for reorder:', fetchError)
      return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 })
    }

    const openIds = new Set((openTasks ?? []).map((task) => task.id))

    if (orderedIds.length !== openIds.size || orderedIds.some((id) => !openIds.has(id))) {
      return NextResponse.json({ error: 'Invalid task order' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updates = await Promise.all(
      orderedIds.map((id, index) =>
        supabaseServer
          .from('TeacherTask')
          .update({ sortOrder: index, updatedAt: now })
          .eq('id', id)
          .eq('teacherId', session.user.id)
          .eq('status', 'OPEN')
      )
    )

    const failed = updates.find((result) => result.error)
    if (failed?.error) {
      console.error('Error reordering teacher tasks:', failed.error)
      return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 })
    }

    const { data, error } = await supabaseServer
      .from('TeacherTask')
      .select('*')
      .eq('teacherId', session.user.id)
      .eq('status', 'OPEN')
      .order('sortOrder', { ascending: true })

    if (error) {
      console.error('Error fetching reordered tasks:', error)
      return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in PUT /api/teacher-tasks/reorder:', error)
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 })
  }
}
