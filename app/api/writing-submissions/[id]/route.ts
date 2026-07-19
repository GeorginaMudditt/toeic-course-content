import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

async function loadSubmission(id: string) {
  const { data, error } = await supabaseServer
    .from('WritingSubmission')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error loading writing submission:', error)
    return { submission: null, error }
  }
  return { submission: data, error: null }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submission, error } = await loadSubmission(params.id)
    if (error) {
      return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 })
    }
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isTeacher = session.user.role === 'TEACHER'
    const isOwner = session.user.role === 'STUDENT' && submission.studentId === session.user.id
    if (!isTeacher && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error in GET /api/writing-submissions/[id]:', error)
    return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submission, error: loadError } = await loadSubmission(params.id)
    if (loadError) {
      return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 })
    }
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const now = new Date().toISOString()
    const updates: Record<string, unknown> = { updatedAt: now }

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim()
    }

    if (typeof body.originalText === 'string') {
      updates.originalText = body.originalText
    }

    if (typeof body.markedHtml === 'string') {
      updates.markedHtml = body.markedHtml
    }

    if (typeof body.teacherComments === 'string') {
      updates.teacherComments = body.teacherComments.trim() || null
    }

    if (body.score === null) {
      updates.score = null
    } else if (typeof body.score === 'number' && Number.isFinite(body.score)) {
      updates.score = body.score
    }

    const publish = body.publish === true || body.status === 'MARKED'
    if (publish) {
      updates.status = 'MARKED'
      updates.markedAt = now
      updates.markedById = session.user.id
      if (typeof body.markedHtml === 'string') {
        updates.markedHtml = body.markedHtml
      }
    } else if (body.status === 'SUBMITTED') {
      updates.status = 'SUBMITTED'
      updates.markedAt = null
    }

    const { data, error } = await supabaseServer
      .from('WritingSubmission')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating writing submission:', error)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission: data })
  } catch (error) {
    console.error('Error in PATCH /api/writing-submissions/[id]:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submission, error: loadError } = await loadSubmission(params.id)
    if (loadError) {
      return NextResponse.json({ error: 'Failed to load submission' }, { status: 500 })
    }
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (submission.fileUrl) {
      try {
        const fileUrl = decodeURIComponent(submission.fileUrl)
        const pathMatch = fileUrl.match(/(writing-submissions\/[^?]+)/)
        if (pathMatch) {
          await supabaseServer.storage.from('resources').remove([pathMatch[1]])
        }
      } catch (storageError) {
        console.error('Error deleting writing file from storage:', storageError)
      }
    }

    const { error } = await supabaseServer
      .from('WritingSubmission')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting writing submission:', error)
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/writing-submissions/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
