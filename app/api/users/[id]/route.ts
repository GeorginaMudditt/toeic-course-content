import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  isValidStudentLifecycleStatus,
} from '@/lib/student-lifecycle-status'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rawStatus = body.studentLifecycleStatus
    const rawDashboardFolderArchived = body.dashboardFolderArchived
    const rawVocabularyProgressArchived = body.vocabularyProgressArchived

    const hasStatusUpdate = rawStatus !== undefined
    const hasDashboardArchiveUpdate = rawDashboardFolderArchived !== undefined
    const hasVocabularyProgressArchiveUpdate = rawVocabularyProgressArchived !== undefined

    if (!hasStatusUpdate && !hasDashboardArchiveUpdate && !hasVocabularyProgressArchiveUpdate) {
      return NextResponse.json(
        {
          error:
            'studentLifecycleStatus, dashboardFolderArchived, or vocabularyProgressArchived is required',
        },
        { status: 400 }
      )
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (hasStatusUpdate) {
      if (typeof rawStatus !== 'string') {
        return NextResponse.json({ error: 'Invalid studentLifecycleStatus' }, { status: 400 })
      }
      if (!isValidStudentLifecycleStatus(rawStatus)) {
        return NextResponse.json({ error: 'Invalid studentLifecycleStatus' }, { status: 400 })
      }
      updatePayload.studentLifecycleStatus = rawStatus
    }

    if (hasDashboardArchiveUpdate) {
      if (typeof rawDashboardFolderArchived !== 'boolean') {
        return NextResponse.json({ error: 'Invalid dashboardFolderArchived' }, { status: 400 })
      }
      updatePayload.dashboardFolderArchived = rawDashboardFolderArchived
    }

    if (hasVocabularyProgressArchiveUpdate) {
      if (typeof rawVocabularyProgressArchived !== 'boolean') {
        return NextResponse.json({ error: 'Invalid vocabularyProgressArchived' }, { status: 400 })
      }
      updatePayload.vocabularyProgressArchived = rawVocabularyProgressArchived
    }

    const { data: userData, error: userError } = await supabaseServer
      .from('User')
      .select('id, role')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const { data: updatedUser, error: updateError } = await supabaseServer
      .from('User')
      .update(updatePayload)
      .eq('id', params.id)
      .select('id, email, name, studentLifecycleStatus, dashboardFolderArchived, vocabularyProgressArchived')
      .single()

    if (updateError) {
      console.error('Error updating student:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update student' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error in PATCH /api/users/[id]:', error)
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const hasName = typeof data.name === 'string'
    const hasEmail = typeof data.email === 'string'

    if (!hasName && !hasEmail) {
      return NextResponse.json({ error: 'Name or email is required' }, { status: 400 })
    }

    // Verify the user exists and is a student
    const { data: userData, error: userError } = await supabaseServer
      .from('User')
      .select('id, role, email, name')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (hasName) {
      const name = data.name.trim()
      if (!name) {
        return NextResponse.json({ error: 'Please enter a name' }, { status: 400 })
      }
      updatePayload.name = name
    }

    if (hasEmail) {
      const normalizedEmail = data.email.toLowerCase().trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
      }

      if (normalizedEmail !== userData.email.toLowerCase().trim()) {
        const { data: existingUser, error: checkError } = await supabaseServer
          .from('User')
          .select('id')
          .eq('email', normalizedEmail)
          .neq('id', params.id)
          .maybeSingle()

        if (checkError) {
          console.error('Error checking email:', checkError)
          return NextResponse.json(
            { error: 'Failed to verify email availability' },
            { status: 500 }
          )
        }

        if (existingUser) {
          return NextResponse.json(
            { error: 'Email is already in use' },
            { status: 400 }
          )
        }
      }

      updatePayload.email = normalizedEmail
    }

    const { data: updatedUser, error: updateError } = await supabaseServer
      .from('User')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating student details:', updateError)
      return NextResponse.json(
        { error: 'Failed to update student details' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating student email:', error)
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user exists and is a student
    const { data: userData, error: userError } = await supabaseServer
      .from('User')
      .select('id, role')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Delete in order:
    // Progress -> CourseNoteRevision -> CourseNotes -> Assignments -> Enrollments -> StudentDocuments -> User
    // First, get all enrollments for this student
    const { data: enrollments, error: enrollmentsError } = await supabaseServer
      .from('Enrollment')
      .select('id')
      .eq('studentId', params.id)

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', JSON.stringify(enrollmentsError, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch student data', details: enrollmentsError.message },
        { status: 500 }
      )
    }

    const enrollmentIds = enrollments?.map(e => e.id) || []

    // Get all assignments for these enrollments
    let assignmentIds: string[] = []
    if (enrollmentIds.length > 0) {
      const { data: assignments, error: assignmentsError } = await supabaseServer
        .from('Assignment')
        .select('id')
        .in('enrollmentId', enrollmentIds)

      if (assignmentsError) {
        console.error('Error fetching assignments:', JSON.stringify(assignmentsError, null, 2))
        return NextResponse.json(
          { error: 'Failed to fetch student data', details: assignmentsError.message },
          { status: 500 }
        )
      }

      assignmentIds = assignments?.map(a => a.id) || []
    }

    // Delete all progress records linked to assignments
    if (assignmentIds.length > 0) {
      const { error: progressError } = await supabaseServer
        .from('Progress')
        .delete()
        .in('assignmentId', assignmentIds)

      if (progressError) {
        console.error('Error deleting progress by assignment:', JSON.stringify(progressError, null, 2))
        return NextResponse.json(
          { error: 'Failed to delete student progress', details: progressError.message },
          { status: 500 }
        )
      }
    }

    // Delete all progress records directly linked to student (must be done separately)
    const { error: directProgressError } = await supabaseServer
      .from('Progress')
      .delete()
      .eq('studentId', params.id)

    if (directProgressError) {
      console.error('Error deleting direct progress:', JSON.stringify(directProgressError, null, 2))
      return NextResponse.json(
        { error: 'Failed to delete student progress', details: directProgressError.message },
        { status: 500 }
      )
    }

    // Delete course note revisions first to satisfy FK constraints, then course notes.
    if (enrollmentIds.length > 0) {
      const { error: noteRevisionsError } = await supabaseServer
        .from('CourseNoteRevision')
        .delete()
        .in('enrollmentId', enrollmentIds)

      if (noteRevisionsError) {
        console.error('Error deleting course note revisions:', JSON.stringify(noteRevisionsError, null, 2))
        return NextResponse.json(
          { error: 'Failed to delete student course note revisions', details: noteRevisionsError.message },
          { status: 500 }
        )
      }

      const { error: courseNotesError } = await supabaseServer
        .from('CourseNote')
        .delete()
        .in('enrollmentId', enrollmentIds)

      if (courseNotesError) {
        console.error('Error deleting course notes:', JSON.stringify(courseNotesError, null, 2))
        return NextResponse.json(
          { error: 'Failed to delete student course notes', details: courseNotesError.message },
          { status: 500 }
        )
      }
    }

    // Delete all assignments (after progress and course notes are deleted)
    if (assignmentIds.length > 0) {
      const { error: assignmentsDeleteError } = await supabaseServer
        .from('Assignment')
        .delete()
        .in('id', assignmentIds)

      if (assignmentsDeleteError) {
        console.error('Error deleting assignments:', JSON.stringify(assignmentsDeleteError, null, 2))
        return NextResponse.json(
          { error: 'Failed to delete student assignments', details: assignmentsDeleteError.message },
          { status: 500 }
        )
      }
    }

    // Delete all enrollments (after assignments and course notes are deleted)
    if (enrollmentIds.length > 0) {
      const { error: enrollmentsDeleteError } = await supabaseServer
        .from('Enrollment')
        .delete()
        .in('id', enrollmentIds)

      if (enrollmentsDeleteError) {
        console.error('Error deleting enrollments:', JSON.stringify(enrollmentsDeleteError, null, 2))
        return NextResponse.json(
          { error: 'Failed to delete student enrollments', details: enrollmentsDeleteError.message },
          { status: 500 }
        )
      }
    }

    // Delete student documents before deleting the user (FK StudentDocument.studentId -> User.id)
    const { error: documentsDeleteError } = await supabaseServer
      .from('StudentDocument')
      .delete()
      .eq('studentId', params.id)

    if (documentsDeleteError) {
      console.error('Error deleting student documents:', JSON.stringify(documentsDeleteError, null, 2))
      return NextResponse.json(
        { error: 'Failed to delete student documents', details: documentsDeleteError.message },
        { status: 500 }
      )
    }

    // Finally, delete the user
    const { error: userDeleteError } = await supabaseServer
      .from('User')
      .delete()
      .eq('id', params.id)

    if (userDeleteError) {
      console.error('Error deleting user:', JSON.stringify(userDeleteError, null, 2))
      return NextResponse.json(
        { error: 'Failed to delete student', details: userDeleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting student:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Failed to delete student', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}
