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
      return NextResponse.json(
        { error: 'orderedIds must be an array of social post ids' },
        { status: 400 }
      )
    }

    const { data: openPosts, error: fetchError } = await supabaseServer
      .from('TeacherSocialPost')
      .select('id')
      .eq('teacherId', session.user.id)
      .eq('status', 'OPEN')

    if (fetchError) {
      console.error('Error fetching open social posts for reorder:', fetchError)
      return NextResponse.json({ error: 'Failed to reorder social posts' }, { status: 500 })
    }

    const openIds = new Set((openPosts ?? []).map((post) => post.id))

    if (orderedIds.length !== openIds.size || orderedIds.some((id) => !openIds.has(id))) {
      return NextResponse.json({ error: 'Invalid social post order' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updates = await Promise.all(
      orderedIds.map((id: string, index: number) =>
        supabaseServer
          .from('TeacherSocialPost')
          .update({ sortOrder: index, updatedAt: now })
          .eq('id', id)
          .eq('teacherId', session.user.id)
          .eq('status', 'OPEN')
      )
    )

    const failed = updates.find((result) => result.error)
    if (failed?.error) {
      console.error('Error reordering teacher social posts:', failed.error)
      return NextResponse.json({ error: 'Failed to reorder social posts' }, { status: 500 })
    }

    const { data, error } = await supabaseServer
      .from('TeacherSocialPost')
      .select('*')
      .eq('teacherId', session.user.id)
      .eq('status', 'OPEN')
      .order('sortOrder', { ascending: true })

    if (error) {
      console.error('Error fetching reordered social posts:', error)
      return NextResponse.json({ error: 'Failed to reorder social posts' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in PUT /api/teacher-social-posts/reorder:', error)
    return NextResponse.json({ error: 'Failed to reorder social posts' }, { status: 500 })
  }
}
