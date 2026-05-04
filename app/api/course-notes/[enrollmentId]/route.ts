import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { countLoggedLessonsFromNotesContent } from '@/lib/course-notes-lessons'
import { formatCourseName } from '@/lib/date-utils'
import { sendCourseMidpointNotificationEmail } from '@/lib/email'

function studentSafeNote(note: Record<string, unknown> | null) {
  if (!note) return null
  return {
    id: note.id,
    enrollmentId: note.enrollmentId,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

async function maybeNotifyCourseMidpoint(params: {
  enrollmentId: string
  courseNoteId: string
  savedStudentContent: string
  midpointAlreadySent: boolean
}) {
  if (params.midpointAlreadySent) return

  const lessonsLogged = countLoggedLessonsFromNotesContent(params.savedStudentContent)

  const { data: en, error: enError } = await supabaseServer
    .from('Enrollment')
    .select('studentId, courseId')
    .eq('id', params.enrollmentId)
    .single()

  if (enError || !en) return

  const { data: course, error: courseError } = await supabaseServer
    .from('Course')
    .select('name, duration')
    .eq('id', en.courseId)
    .single()

  if (courseError || !course) return

  const duration = typeof course.duration === 'number' ? course.duration : 0
  if (duration <= 0) return

  const threshold = Math.ceil(duration / 2)
  if (lessonsLogged < threshold) return

  const { data: student } = await supabaseServer
    .from('User')
    .select('name')
    .eq('id', en.studentId)
    .single()

  const studentName = student?.name ?? 'Student'
  const courseName = formatCourseName(course.name ?? 'Course', duration)

  const result = await sendCourseMidpointNotificationEmail({
    studentName,
    courseName,
    courseDurationHours: duration,
    lessonsLogged,
  })

  if ('error' in result && result.error) {
    console.warn('Course midpoint email not sent:', result.error)
    return
  }

  const nowIso = new Date().toISOString()
  const { error: flagError } = await supabaseServer
    .from('CourseNote')
    .update({ midpointNotificationSentAt: nowIso })
    .eq('id', params.courseNoteId)
    .is('midpointNotificationSentAt', null)

  if (flagError) {
    console.error('Failed to set midpointNotificationSentAt:', flagError)
  }
}

// GET - Fetch note for an enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('studentId, courseId')
      .eq('id', params.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const isTeacher = session.user.role === 'TEACHER'
    const isStudent =
      session.user.role === 'STUDENT' && session.user.id === enrollmentData.studentId

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: noteData, error: noteError } = await supabaseServer
      .from('CourseNote')
      .select('*')
      .eq('enrollmentId', params.enrollmentId)
      .single()

    if (noteError && noteError.code !== 'PGRST116') {
      console.error('Error fetching note:', noteError)
      return NextResponse.json({ error: 'Error fetching note' }, { status: 500 })
    }

    const note = noteData as Record<string, unknown> | null

    if (isStudent) {
      return NextResponse.json({ note: studentSafeNote(note) })
    }

    return NextResponse.json({ note: note || null })
  } catch (error) {
    console.error('Error in GET /api/course-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Create or update note for an enrollment
export async function PUT(
  request: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, expectedUpdatedAt, teacherPrivateContent } = body

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

    const teacherPrivate =
      typeof teacherPrivateContent === 'string' ? teacherPrivateContent : ''

    if (expectedUpdatedAt === undefined) {
      return NextResponse.json(
        { error: 'Missing expectedUpdatedAt (required for concurrency protection)' },
        { status: 400 }
      )
    }

    const expectedUpdatedAtIso: string | null = expectedUpdatedAt === null ? null : expectedUpdatedAt
    if (expectedUpdatedAtIso !== null && typeof expectedUpdatedAtIso !== 'string') {
      return NextResponse.json({ error: 'Invalid expectedUpdatedAt' }, { status: 400 })
    }

    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('id')
      .eq('id', params.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    if (expectedUpdatedAtIso === null) {
      const newNote = {
        id: randomUUID(),
        enrollmentId: params.enrollmentId,
        content,
        teacherPrivateContent: teacherPrivate,
        createdAt: nowIso,
        updatedAt: nowIso,
      }

      const { data: createdNote, error: createError } = await supabaseServer
        .from('CourseNote')
        .insert(newNote)
        .select()
        .single()

      if (createError) {
        if (createError.code === '23505') {
          const { data: currentNote } = await supabaseServer
            .from('CourseNote')
            .select('id, updatedAt')
            .eq('enrollmentId', params.enrollmentId)
            .maybeSingle()

          return NextResponse.json(
            { error: 'Conflict: note already exists', currentUpdatedAt: currentNote?.updatedAt ?? null },
            { status: 409 }
          )
        }

        console.error('Error creating note:', createError)
        return NextResponse.json({ error: 'Error creating note' }, { status: 500 })
      }

      const { error: revisionError } = await supabaseServer.from('CourseNoteRevision').insert({
        id: randomUUID(),
        courseNoteId: createdNote.id,
        enrollmentId: params.enrollmentId,
        content,
        createdAt: nowIso,
        createdBy: session.user.id,
        expectedUpdatedAt: null,
      })

      if (revisionError) {
        console.error('Error inserting note revision (create):', revisionError)
      }

      void maybeNotifyCourseMidpoint({
        enrollmentId: params.enrollmentId,
        courseNoteId: createdNote.id,
        savedStudentContent: content,
        midpointAlreadySent: !!createdNote.midpointNotificationSentAt,
      })

      return NextResponse.json({ note: createdNote })
    }

    const { data: updatedNotes, error: updateError } = await supabaseServer
      .from('CourseNote')
      .update({ content, teacherPrivateContent: teacherPrivate, updatedAt: nowIso })
      .eq('enrollmentId', params.enrollmentId)
      .eq('updatedAt', expectedUpdatedAtIso)
      .select()

    if (updateError) {
      console.error('Error updating note:', updateError)
      return NextResponse.json({ error: 'Error updating note' }, { status: 500 })
    }

    if (!updatedNotes || updatedNotes.length === 0) {
      const { data: currentNote } = await supabaseServer
        .from('CourseNote')
        .select('id, updatedAt')
        .eq('enrollmentId', params.enrollmentId)
        .maybeSingle()

      return NextResponse.json(
        { error: 'Conflict: note was modified elsewhere', currentUpdatedAt: currentNote?.updatedAt ?? null },
        { status: 409 }
      )
    }

    const updatedNote = updatedNotes[0]

    const { error: revisionError } = await supabaseServer.from('CourseNoteRevision').insert({
      id: randomUUID(),
      courseNoteId: updatedNote.id,
      enrollmentId: params.enrollmentId,
      content,
      createdAt: nowIso,
      createdBy: session.user.id,
      expectedUpdatedAt: expectedUpdatedAtIso,
    })

    if (revisionError) {
      console.error('Error inserting note revision (update):', revisionError)
    }

    void maybeNotifyCourseMidpoint({
      enrollmentId: params.enrollmentId,
      courseNoteId: updatedNote.id,
      savedStudentContent: content,
      midpointAlreadySent: !!updatedNote.midpointNotificationSentAt,
    })

    return NextResponse.json({ note: updatedNote })
  } catch (error) {
    console.error('Error in PUT /api/course-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
