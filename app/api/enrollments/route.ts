import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId, courseId } = await request.json()

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'Student ID and Course ID are required' },
        { status: 400 }
      )
    }

    // Verify course belongs to teacher
    const { data: course, error: courseError } = await supabaseServer
      .from('Course')
      .select('id, creatorId')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabaseServer
      .from('User')
      .select('id, role')
      .eq('id', studentId)
      .eq('role', 'STUDENT')
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if enrollment already exists
    const { data: existingEnrollments, error: checkError } = await supabaseServer
      .from('Enrollment')
      .select('id')
      .eq('studentId', studentId)
      .eq('courseId', courseId)

    if (checkError) {
      console.error('Error checking existing enrollment:', checkError)
      // Continue - might be a network issue, let the insert handle the constraint
    } else if (existingEnrollments && existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 400 }
      )
    }

    // Create enrollment with generated ID
    const enrollmentId = randomUUID()
    const { data: enrollment, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .insert({
        id: enrollmentId,
        studentId,
        courseId
      })
      .select()
      .single()

    if (enrollmentError) {
      // Check for unique constraint violation
      if (enrollmentError.code === '23505' || enrollmentError.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'Student is already enrolled in this course' },
          { status: 400 }
        )
      }
      console.error('Error creating enrollment:', enrollmentError)
      console.error('Enrollment error details:', JSON.stringify(enrollmentError, null, 2))
      return NextResponse.json(
        { error: enrollmentError.message || 'Failed to create enrollment' },
        { status: 500 }
      )
    }

    return NextResponse.json(enrollment)
  } catch (error: any) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}


