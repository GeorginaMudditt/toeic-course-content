import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

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

    // Verify the user exists and is a student
    const { data: userData, error: userError } = await supabaseServer
      .from('User')
      .select('id, role, email')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Validate email if provided
    if (data.email) {
      const normalizedEmail = data.email.toLowerCase().trim()
      
      // Check if email is already in use by another user
      const { data: existingUser, error: checkError } = await supabaseServer
        .from('User')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', params.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
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

      // Update email
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('User')
        .update({ email: normalizedEmail })
        .eq('id', params.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating email:', updateError)
        return NextResponse.json(
          { error: 'Failed to update email' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, user: updatedUser })
    }

    return NextResponse.json({ error: 'No email provided' }, { status: 400 })
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

    // Delete in order: Progress -> Assignments -> Enrollments -> User
    // First, get all enrollments for this student
    const { data: enrollments, error: enrollmentsError } = await supabaseServer
      .from('Enrollment')
      .select('id')
      .eq('studentId', params.id)

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch student data' },
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
        console.error('Error fetching assignments:', assignmentsError)
        return NextResponse.json(
          { error: 'Failed to fetch student data' },
          { status: 500 }
        )
      }

      assignmentIds = assignments?.map(a => a.id) || []
    }

    // Delete all progress records for this student
    if (assignmentIds.length > 0) {
      const { error: progressError } = await supabaseServer
        .from('Progress')
        .delete()
        .in('assignmentId', assignmentIds)

      if (progressError) {
        console.error('Error deleting progress:', progressError)
        return NextResponse.json(
          { error: 'Failed to delete student progress' },
          { status: 500 }
        )
      }
    }

    // Also delete progress records directly linked to student (if any)
    const { error: directProgressError } = await supabaseServer
      .from('Progress')
      .delete()
      .eq('studentId', params.id)

    if (directProgressError) {
      console.error('Error deleting direct progress:', directProgressError)
      return NextResponse.json(
        { error: 'Failed to delete student progress' },
        { status: 500 }
      )
    }

    // Delete all assignments
    if (assignmentIds.length > 0) {
      const { error: assignmentsDeleteError } = await supabaseServer
        .from('Assignment')
        .delete()
        .in('id', assignmentIds)

      if (assignmentsDeleteError) {
        console.error('Error deleting assignments:', assignmentsDeleteError)
        return NextResponse.json(
          { error: 'Failed to delete student assignments' },
          { status: 500 }
        )
      }
    }

    // Delete all course notes for these enrollments
    if (enrollmentIds.length > 0) {
      const { error: courseNotesError } = await supabaseServer
        .from('CourseNote')
        .delete()
        .in('enrollmentId', enrollmentIds)

      if (courseNotesError) {
        console.error('Error deleting course notes:', courseNotesError)
        return NextResponse.json(
          { error: 'Failed to delete student course notes' },
          { status: 500 }
        )
      }
    }

    // Delete all enrollments
    if (enrollmentIds.length > 0) {
      const { error: enrollmentsDeleteError } = await supabaseServer
        .from('Enrollment')
        .delete()
        .in('id', enrollmentIds)

      if (enrollmentsDeleteError) {
        console.error('Error deleting enrollments:', enrollmentsDeleteError)
        return NextResponse.json(
          { error: 'Failed to delete student enrollments' },
          { status: 500 }
        )
      }
    }

    // Finally, delete the user
    const { error: userDeleteError } = await supabaseServer
      .from('User')
      .delete()
      .eq('id', params.id)

    if (userDeleteError) {
      console.error('Error deleting user:', userDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
