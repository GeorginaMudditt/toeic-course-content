import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseResourceWrite } from '@/lib/english-outside-class'
import { deleteResourceRow, updateResourceRow } from '@/lib/english-outside-store'

async function requireTeacher() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') return null
  return session
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const now = new Date().toISOString()
    const keys = body && typeof body === 'object' ? Object.keys(body) : []

    if (keys.length === 1 && (body.status === 'HIDDEN' || body.status === 'PUBLISHED')) {
      const { error } = await updateResourceRow(params.id, { status: body.status, updatedAt: now })

      if (error) {
        console.error('Error updating English Outside status:', error)
        return NextResponse.json({ error: 'Could not update that title.' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    const parsed = parseResourceWrite(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { error } = await updateResourceRow(params.id, { ...parsed.data, updatedAt: now })

    if (error) {
      console.error('Error updating English Outside resource:', error)
      return NextResponse.json({ error: 'Could not update that title.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in PATCH /api/english-outside-class/[id]:', error)
    return NextResponse.json({ error: 'Could not update that title.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await deleteResourceRow(params.id)
    if (error) {
      console.error('Error deleting English Outside resource:', error)
      return NextResponse.json({ error: 'Could not delete that title.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in DELETE /api/english-outside-class/[id]:', error)
    return NextResponse.json({ error: 'Could not delete that title.' }, { status: 500 })
  }
}
