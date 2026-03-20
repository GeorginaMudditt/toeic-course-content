import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

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

    // Verify enrollment exists and user has access
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('studentId, courseId')
      .eq('id', params.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check if user is teacher or the student
    const isTeacher = session.user.role === 'TEACHER'
    const isStudent = session.user.role === 'STUDENT' && session.user.id === enrollmentData.studentId

    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the note
    const { data: noteData, error: noteError } = await supabaseServer
      .from('CourseNote')
      .select('*')
      .eq('enrollmentId', params.enrollmentId)
      .single()

    if (noteError && noteError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching note:', noteError)
      return NextResponse.json({ error: 'Error fetching note' }, { status: 500 })
    }

    return NextResponse.json({ note: noteData || null })
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

    const { content, expectedUpdatedAt } = await request.json()

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

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

    // Verify enrollment exists
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('id')
      .eq('id', params.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    // CREATE path: expectedUpdatedAt must be null when the caller believes no note exists yet.
    if (expectedUpdatedAtIso === null) {
      const newNote = {
        id: randomUUID(),
        enrollmentId: params.enrollmentId,
        content,
        createdAt: nowIso,
        updatedAt: nowIso
      }

      const { data: createdNote, error: createError } = await supabaseServer
        .from('CourseNote')
        .insert(newNote)
        .select()
        .single()

      if (createError) {
        // Unique violation: someone created the note after this editor loaded.
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

      const { error: revisionError } = await supabaseServer
        .from('CourseNoteRevision')
        .insert({
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
        return NextResponse.json({ error: 'Error writing revision log' }, { status: 500 })
      }

      return NextResponse.json({ note: createdNote })
    }

    // UPDATE path: only update if the CourseNote hasn't changed since the caller loaded it.
    const { data: updatedNotes, error: updateError } = await supabaseServer
      .from('CourseNote')
      .update({ content, updatedAt: nowIso })
      .eq('enrollmentId', params.enrollmentId)
      .eq('updatedAt', expectedUpdatedAtIso)
      .select()

    if (updateError) {
      console.error('Error updating note:', updateError)
      return NextResponse.json({ error: 'Error updating note' }, { status: 500 })
    }

    if (!updatedNotes || updatedNotes.length === 0) {
      // Conflict: another tab saved first.
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

    const { error: revisionError } = await supabaseServer
      .from('CourseNoteRevision')
      .insert({
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
      return NextResponse.json({ error: 'Error writing revision log' }, { status: 500 })
    }

    return NextResponse.json({ note: updatedNote })
  } catch (error) {
    console.error('Error in PUT /api/course-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
