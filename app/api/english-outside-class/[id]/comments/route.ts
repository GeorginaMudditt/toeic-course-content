import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { findPublishedResource, hasPendingComment, insertCommentRow } from '@/lib/english-outside-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Real-World English is not open to students yet.' },
      { status: 403 }
    )

    const body = await request.json()
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (text.length < 2 || text.length > 400) {
      return NextResponse.json({ error: 'Write a short comment (2–400 characters).' }, { status: 400 })
    }

    const { found, error: resourceError } = await findPublishedResource(params.id)
    if (resourceError || !found) {
      return NextResponse.json({ error: 'That title is not on the list.' }, { status: 404 })
    }

    const { found: pending, error: pendingError } = await hasPendingComment(params.id, session.user.id)
    if (pendingError) {
      console.error('Error checking pending comment:', pendingError)
      return NextResponse.json({ error: 'Could not send your comment.' }, { status: 500 })
    }
    if (pending) {
      return NextResponse.json(
        { error: 'You already have a comment waiting to be checked for this title.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const { error } = await insertCommentRow({
      id: randomUUID(),
      resourceId: params.id,
      studentId: session.user.id,
      studentName: session.user.name || 'Student',
      body: text,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    })

    if (error) {
      console.error('Error saving comment:', error)
      return NextResponse.json({ error: 'Could not send your comment.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST comment:', error)
    return NextResponse.json({ error: 'Could not send your comment.' }, { status: 500 })
  }
}
