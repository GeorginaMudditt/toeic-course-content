import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseServer
      .from('TeacherTask')
      .select('*')
      .eq('teacherId', session.user.id)

    if (error) {
      console.error('Error fetching teacher tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const tasks = [...(data ?? [])].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'OPEN' ? -1 : 1
      }
      if (a.status === 'OPEN') {
        return a.sortOrder - b.sortOrder
      }
      return new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error in GET /api/teacher-tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: openTasks, error: openError } = await supabaseServer
      .from('TeacherTask')
      .select('sortOrder')
      .eq('teacherId', session.user.id)
      .eq('status', 'OPEN')
      .order('sortOrder', { ascending: false })
      .limit(1)

    if (openError) {
      console.error('Error reading open task order:', openError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    const nextSortOrder = openTasks?.[0]?.sortOrder != null ? openTasks[0].sortOrder + 1 : 0
    const now = new Date().toISOString()

    const { data, error } = await supabaseServer
      .from('TeacherTask')
      .insert({
        id: randomUUID(),
        teacherId: session.user.id,
        title,
        status: 'OPEN',
        sortOrder: nextSortOrder,
        createdAt: now,
        updatedAt: now,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating teacher task:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/teacher-tasks:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
