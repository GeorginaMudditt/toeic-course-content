import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateCommentRow } from '@/lib/english-outside-store'

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
    if (body.status !== 'APPROVED' && body.status !== 'DECLINED') {
      return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
    }

    const update: { status: string; updatedAt: string; body?: string } = {
      status: body.status,
      updatedAt: new Date().toISOString(),
    }

    if (body.status === 'APPROVED') {
      const text = typeof body.body === 'string' ? body.body.trim() : ''
      if (text.length < 2 || text.length > 400) {
        return NextResponse.json({ error: 'The comment needs to stay between 2 and 400 characters.' }, { status: 400 })
      }
      update.body = text
    }

    const { error } = await updateCommentRow(params.id, update)

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json({ error: 'Could not update that comment.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in PATCH comment:', error)
    return NextResponse.json({ error: 'Could not update that comment.' }, { status: 500 })
  }
}
