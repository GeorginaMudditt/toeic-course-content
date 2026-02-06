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

    const { content } = await request.json()

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
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

    // Check if note exists
    const { data: existingNote, error: checkError } = await supabaseServer
      .from('CourseNote')
      .select('id')
      .eq('enrollmentId', params.enrollmentId)
      .single()

    if (existingNote && !checkError) {
      // Update existing note
      const { data: updatedNote, error: updateError } = await supabaseServer
        .from('CourseNote')
        .update({ content, updatedAt: new Date().toISOString() })
        .eq('id', existingNote.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating note:', updateError)
        return NextResponse.json({ error: 'Error updating note' }, { status: 500 })
      }

      return NextResponse.json({ note: updatedNote })
    } else {
      // Create new note
      const newNote = {
        id: randomUUID(),
        enrollmentId: params.enrollmentId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const { data: createdNote, error: createError } = await supabaseServer
        .from('CourseNote')
        .insert(newNote)
        .select()
        .single()

      if (createError) {
        console.error('Error creating note:', createError)
        return NextResponse.json({ error: 'Error creating note' }, { status: 500 })
      }

      return NextResponse.json({ note: createdNote })
    }
  } catch (error) {
    console.error('Error in PUT /api/course-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
