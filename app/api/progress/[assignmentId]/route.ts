import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notes, status } = await request.json()

    // Verify assignment belongs to student using Supabase
    const { data: assignmentData, error: assignmentError } = await supabaseServer
      .from('Assignment')
      .select('id, enrollmentId')
      .eq('id', params.assignmentId)
      .single()

    if (assignmentError || !assignmentData) {
      console.error('Error fetching assignment:', assignmentError)
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Fetch enrollment to verify it belongs to the student
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('studentId')
      .eq('id', assignmentData.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      console.error('Error fetching enrollment:', enrollmentError)
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check if assignment belongs to student
    if (enrollmentData.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if progress already exists
    const { data: existingProgress, error: checkError } = await supabaseServer
      .from('Progress')
      .select('id')
      .eq('assignmentId', params.assignmentId)
      .eq('studentId', session.user.id)
      .single()

    const now = new Date().toISOString()
    const completedAt = status === 'COMPLETED' ? now : null

    let progress
    if (existingProgress && !checkError) {
      // Update existing progress
      const { data: updatedProgress, error: updateError } = await supabaseServer
        .from('Progress')
        .update({
          notes,
          status,
          completedAt,
          updatedAt: now
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating progress:', updateError)
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        )
      }
      progress = updatedProgress
    } else {
      // Create new progress
      const { data: newProgress, error: insertError } = await supabaseServer
        .from('Progress')
        .insert({
          id: randomUUID(),
          assignmentId: params.assignmentId,
          studentId: session.user.id,
          notes,
          status,
          completedAt,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating progress:', insertError)
        // If it's a unique constraint violation, try updating instead
        if (insertError.code === '23505' || insertError.message?.includes('unique')) {
          const { data: updatedProgress, error: updateError } = await supabaseServer
            .from('Progress')
            .update({
              notes,
              status,
              completedAt,
              updatedAt: now
            })
            .eq('assignmentId', params.assignmentId)
            .eq('studentId', session.user.id)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating progress after conflict:', updateError)
            return NextResponse.json(
              { error: 'Failed to save progress' },
              { status: 500 }
            )
          }
          progress = updatedProgress
        } else {
          return NextResponse.json(
            { error: 'Failed to create progress' },
            { status: 500 }
          )
        }
      } else {
        progress = newProgress
      }
    }

    return NextResponse.json(progress)
  } catch (error: any) {
    console.error('Error saving progress:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save progress' },
      { status: 500 }
    )
  }
}


