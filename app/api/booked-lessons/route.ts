import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { deleteBookedLesson, upsertBookedLesson } from '@/lib/booked-lessons'

function authorized(request: NextRequest): boolean {
  const expected = process.env.BOOKING_SYNC_SECRET
  if (!expected) return false
  const header = request.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length === 0 || a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!process.env.BOOKING_SYNC_SECRET) {
    return NextResponse.json({ error: 'Booking sync is not configured' }, { status: 503 })
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid booking' }, { status: 400 })
  }

  if (body.action === 'delete') {
    const websiteLessonId = typeof body.websiteLessonId === 'string' ? body.websiteLessonId : ''
    const result = await deleteBookedLesson(websiteLessonId)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  if (body.action !== 'upsert' || !body.lesson || typeof body.lesson !== 'object') {
    return NextResponse.json({ error: 'Invalid booking' }, { status: 400 })
  }

  const lesson = body.lesson as Record<string, unknown>
  const result = await upsertBookedLesson({
    websiteLessonId: typeof lesson.websiteLessonId === 'string' ? lesson.websiteLessonId : '',
    studentEmail: typeof lesson.studentEmail === 'string' ? lesson.studentEmail : '',
    studentName: typeof lesson.studentName === 'string' ? lesson.studentName : null,
    date: typeof lesson.date === 'string' ? lesson.date : '',
    startTime: typeof lesson.startTime === 'string' ? lesson.startTime : '',
    endTime: typeof lesson.endTime === 'string' ? lesson.endTime : '',
    lessonType: typeof lesson.lessonType === 'string' ? lesson.lessonType : null,
  })

  if (result.error === 'Invalid booking') {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
