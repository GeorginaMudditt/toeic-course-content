import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, resourceId, sectionSlug, sectionLabel } = body as {
      assignmentId?: string
      resourceId?: string
      sectionSlug?: string
      sectionLabel?: string
    }

    if (!assignmentId || !resourceId || !sectionSlug || !sectionLabel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: assignmentData, error: assignmentError } = await supabaseServer
      .from('Assignment')
      .select('id, enrollmentId, resourceId')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignmentData) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignmentData.resourceId !== resourceId) {
      return NextResponse.json({ error: 'Resource mismatch' }, { status: 400 })
    }

    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('studentId')
      .eq('id', assignmentData.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (enrollmentData.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: existing, error: existingError } = await supabaseServer
      .from('ResourceBookmark')
      .select('id')
      .eq('studentId', session.user.id)
      .eq('assignmentId', assignmentId)
      .eq('sectionSlug', sectionSlug)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking bookmark:', existingError)
      return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 })
    }

    if (existing) {
      const { error: deleteError } = await supabaseServer
        .from('ResourceBookmark')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError)
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: false })
    }

    const now = new Date().toISOString()
    const { data: created, error: createError } = await supabaseServer
      .from('ResourceBookmark')
      .insert({
        id: randomUUID(),
        studentId: session.user.id,
        assignmentId,
        resourceId,
        sectionSlug,
        sectionLabel,
        createdAt: now,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating bookmark:', createError)
      return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: true, id: created?.id })
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 })
  }
}
