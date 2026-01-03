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

    const { enrollmentId, resourceIds } = await request.json()

    if (!enrollmentId || !resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request: enrollmentId and resourceIds array required' }, { status: 400 })
    }

    // Verify enrollment belongs to teacher's course using Supabase
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      console.error('Error fetching enrollment:', enrollmentError)
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Fetch the course to verify ownership
    const { data: courseData, error: courseError } = await supabaseServer
      .from('Course')
      .select('*')
      .eq('id', enrollmentData.courseId)
      .single()

    if (courseError || !courseData) {
      console.error('Error fetching course:', courseError)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (courseData.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current max order using Supabase
    const { data: maxOrderData, error: maxOrderError } = await supabaseServer
      .from('Assignment')
      .select('order')
      .eq('enrollmentId', enrollmentId)
      .order('order', { ascending: false })
      .limit(1)
      .single()

    let nextOrder = 1
    if (!maxOrderError && maxOrderData && maxOrderData.order) {
      nextOrder = (maxOrderData.order as number) + 1
    }

    // Create assignments using Supabase
    const now = new Date().toISOString()
    const assignmentsToInsert = resourceIds.map((resourceId: string) => ({
      id: randomUUID(),
      enrollmentId,
      resourceId,
      order: nextOrder++,
      assignedAt: now
    }))

    const { data: assignments, error: insertError } = await supabaseServer
      .from('Assignment')
      .insert(assignmentsToInsert)
      .select()

    if (insertError) {
      console.error('Error creating assignments:', insertError)
      // Check if it's a unique constraint violation (resource already assigned)
      if (insertError.code === '23505' || insertError.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'One or more resources are already assigned to this enrollment' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: insertError.message || 'Failed to create assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json(assignments || [])
  } catch (error: any) {
    console.error('Error creating assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create assignments' },
      { status: 500 }
    )
  }
}


