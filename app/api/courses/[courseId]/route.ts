import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { parseCourseDurationHours } from '@/lib/course-notes-lessons'

/**
 * PATCH — teacher updates total package hours on a course they own.
 * Used when a course was created with 0 hours (e.g. custom "Other" enrollment).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawDuration =
    typeof body === 'object' && body !== null && 'duration' in body
      ? (body as Record<string, unknown>).duration
      : undefined

  const duration = parseCourseDurationHours(rawDuration)
  if (duration <= 0) {
    return NextResponse.json(
      { error: 'duration must be a positive whole number of hours' },
      { status: 400 }
    )
  }

  const { data: course, error: fetchError } = await supabaseServer
    .from('Course')
    .select('id, creatorId')
    .eq('id', params.courseId)
    .single()

  if (fetchError || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (course.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const nowIso = new Date().toISOString()
  const { error: updateError } = await supabaseServer
    .from('Course')
    .update({ duration, updatedAt: nowIso })
    .eq('id', params.courseId)
    .eq('creatorId', session.user.id)

  if (updateError) {
    console.error('[courses PATCH]', updateError)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, duration })
}
