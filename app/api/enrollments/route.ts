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

    const { studentId, courseId, courseData } = await request.json()

    if (!studentId || (!courseId && !courseData)) {
      return NextResponse.json(
        { error: 'Student ID and either Course ID or courseData are required' },
        { status: 400 }
      )
    }

    let resolvedCourseId: string = courseId

    if (!resolvedCourseId && courseData) {
      const normalizedName = typeof courseData.name === 'string' ? courseData.name.trim() : ''
      const duration = Number.isFinite(courseData.duration) ? Number(courseData.duration) : 0

      if (!normalizedName) {
        return NextResponse.json({ error: 'Course name is required' }, { status: 400 })
      }
      if (duration < 0) {
        return NextResponse.json({ error: 'Course duration must be 0 or more' }, { status: 400 })
      }

      // Reuse an existing course for this teacher if it already exists.
      const { data: existingCourses, error: existingCourseError } = await supabaseServer
        .from('Course')
        .select('id')
        .eq('creatorId', session.user.id)
        .eq('name', normalizedName)
        .eq('duration', duration)
        .limit(1)

      if (existingCourseError) {
        console.error('Error checking existing course:', existingCourseError)
        return NextResponse.json({ error: 'Failed to verify course' }, { status: 500 })
      }

      if (existingCourses && existingCourses.length > 0) {
        resolvedCourseId = existingCourses[0].id
      } else {
        const newCourseId = randomUUID()
        const { data: createdCourse, error: createCourseError } = await supabaseServer
          .from('Course')
          .insert({
            id: newCourseId,
            name: normalizedName,
            duration,
            creatorId: session.user.id,
          })
          .select('id')
          .single()

        if (createCourseError || !createdCourse) {
          console.error('Error creating course during enrollment:', createCourseError)
          return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
        }

        resolvedCourseId = createdCourse.id
      }
    }

    // Verify course belongs to teacher
    const { data: course, error: courseError } = await supabaseServer
      .from('Course')
      .select('id, creatorId')
      .eq('id', resolvedCourseId)
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
      .eq('courseId', resolvedCourseId)

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
        courseId: resolvedCourseId
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


