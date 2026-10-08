import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markSuggestion } from '@/lib/english-outside-store'

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
    if (body.status !== 'DECLINED') {
      return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
    }

    const { error } = await markSuggestion(
      params.id,
      { status: 'DECLINED', updatedAt: new Date().toISOString() },
      'PENDING'
    )

    if (error) {
      console.error('Error declining suggestion:', error)
      return NextResponse.json({ error: 'Could not decline that suggestion.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in PATCH suggestion:', error)
    return NextResponse.json({ error: 'Could not decline that suggestion.' }, { status: 500 })
  }
}
