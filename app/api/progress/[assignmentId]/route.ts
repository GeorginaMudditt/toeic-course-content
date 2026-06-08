import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  hasMeaningfulNotes,
  resolveNotesForSave,
  resolveStatusForSave,
} from '@/lib/progress-notes'
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

    const body = await request.json()
    const { notes: incomingNotes, status: incomingStatus, markViewedOnly } = body as {
      notes?: string | null
      status?: string
      markViewedOnly?: boolean
    }

    const status = incomingStatus ?? 'NOT_STARTED'

    const { data: assignmentData, error: assignmentError } = await supabaseServer
      .from('Assignment')
      .select('id, enrollmentId')
      .eq('id', params.assignmentId)
      .single()

    if (assignmentError || !assignmentData) {
      console.error('Error fetching assignment:', assignmentError)
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('studentId')
      .eq('id', assignmentData.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      console.error('Error fetching enrollment:', enrollmentError)
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (enrollmentData.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: existingProgress, error: checkError } = await supabaseServer
      .from('Progress')
      .select('id, notes, status')
      .eq('assignmentId', params.assignmentId)
      .eq('studentId', session.user.id)
      .maybeSingle()

    const now = new Date().toISOString()

    // Record a visit — create on first open, or bump updatedAt on return visits without touching saved work.
    if (markViewedOnly) {
      if (existingProgress && !checkError) {
        const { data: updatedProgress, error: touchError } = await supabaseServer
          .from('Progress')
          .update({ updatedAt: now })
          .eq('id', existingProgress.id)
          .select()
          .single()

        if (touchError) {
          console.error('Error updating visit timestamp:', touchError)
          return NextResponse.json(existingProgress)
        }

        return NextResponse.json(updatedProgress)
      }

      const { data: newProgress, error: insertError } = await supabaseServer
        .from('Progress')
        .insert({
          id: randomUUID(),
          assignmentId: params.assignmentId,
          studentId: session.user.id,
          notes: '{}',
          status: 'NOT_STARTED',
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('unique')) {
          const { data: raced } = await supabaseServer
            .from('Progress')
            .select('*')
            .eq('assignmentId', params.assignmentId)
            .eq('studentId', session.user.id)
            .maybeSingle()
          if (raced) return NextResponse.json(raced)
        }
        console.error('Error creating viewed progress:', insertError)
        return NextResponse.json({ error: 'Failed to mark as viewed' }, { status: 500 })
      }

      return NextResponse.json(newProgress)
    }

    const notes = resolveNotesForSave(existingProgress?.notes, incomingNotes ?? '')
    const statusToSave = resolveStatusForSave(existingProgress?.status, status)
    const completedAt = statusToSave === 'COMPLETED' ? now : null

    let progress
    if (existingProgress && !checkError) {
      const { data: updatedProgress, error: updateError } = await supabaseServer
        .from('Progress')
        .update({
          notes,
          status: statusToSave,
          completedAt,
          updatedAt: now,
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating progress:', updateError)
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
      }
      progress = updatedProgress
    } else {
      const { data: newProgress, error: insertError } = await supabaseServer
        .from('Progress')
        .insert({
          id: randomUUID(),
          assignmentId: params.assignmentId,
          studentId: session.user.id,
          notes: hasMeaningfulNotes(notes) ? notes : '{}',
          status: statusToSave,
          completedAt,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating progress:', insertError)
        if (insertError.code === '23505' || insertError.message?.includes('unique')) {
          const { data: racedExisting } = await supabaseServer
            .from('Progress')
            .select('id, notes, status')
            .eq('assignmentId', params.assignmentId)
            .eq('studentId', session.user.id)
            .maybeSingle()

          if (racedExisting) {
            const mergedNotes = resolveNotesForSave(racedExisting.notes, notes)
            const mergedStatus = resolveStatusForSave(racedExisting.status, statusToSave)
            const { data: updatedProgress, error: updateError } = await supabaseServer
              .from('Progress')
              .update({
                notes: mergedNotes,
                status: mergedStatus,
                completedAt: mergedStatus === 'COMPLETED' ? now : null,
                updatedAt: now,
              })
              .eq('id', racedExisting.id)
              .select()
              .single()

            if (updateError) {
              console.error('Error updating progress after conflict:', updateError)
              return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
            }
            progress = updatedProgress
          } else {
            return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 })
        }
      } else {
        progress = newProgress
      }
    }

    return NextResponse.json(progress)
  } catch (error: unknown) {
    console.error('Error saving progress:', error)
    const message = error instanceof Error ? error.message : 'Failed to save progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
