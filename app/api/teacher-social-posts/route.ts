import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { plannedDateToIso } from '@/lib/teacher-social-posts'

function sortPosts<T extends { status: string; sortOrder: number; completedAt: string | null }>(
  posts: T[]
) {
  return [...posts].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'OPEN' ? -1 : 1
    }
    if (a.status === 'OPEN') {
      return a.sortOrder - b.sortOrder
    }
    return new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseServer
      .from('TeacherSocialPost')
      .select('*')
      .eq('teacherId', session.user.id)

    if (error) {
      console.error('Error fetching teacher social posts:', error)
      return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 })
    }

    return NextResponse.json(sortPosts(data ?? []))
  } catch (error) {
    console.error('Error in GET /api/teacher-social-posts:', error)
    return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 })
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
    const plannedDateIso =
      typeof body.plannedDate === 'string' ? plannedDateToIso(body.plannedDate) : null

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!plannedDateIso) {
      return NextResponse.json({ error: 'A valid planned date is required' }, { status: 400 })
    }

    const { data: openPosts, error: openError } = await supabaseServer
      .from('TeacherSocialPost')
      .select('sortOrder')
      .eq('teacherId', session.user.id)
      .eq('status', 'OPEN')
      .order('sortOrder', { ascending: false })
      .limit(1)

    if (openError) {
      console.error('Error reading open social post order:', openError)
      return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 })
    }

    const nextSortOrder = openPosts?.[0]?.sortOrder != null ? openPosts[0].sortOrder + 1 : 0
    const now = new Date().toISOString()

    const { data, error } = await supabaseServer
      .from('TeacherSocialPost')
      .insert({
        id: randomUUID(),
        teacherId: session.user.id,
        title,
        plannedDate: plannedDateIso,
        status: 'OPEN',
        sortOrder: nextSortOrder,
        createdAt: now,
        updatedAt: now,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating teacher social post:', error)
      return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/teacher-social-posts:', error)
    return NextResponse.json({ error: 'Failed to create social post' }, { status: 500 })
  }
}
