import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { contactDatabaseErrorMessage, parseContactBody } from '@/lib/contacts'
import { supabaseServer } from '@/lib/supabase'

async function requireTeacher() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return null
  }
  return session
}

function parseId(id: string) {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) return null
  return numericId
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseId(params.id)
    if (id == null) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const parsed = parseContactBody(await request.json())
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Invalid contact' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('Brizzle_contacts')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Error updating contact:', error)
      return NextResponse.json(
        { error: contactDatabaseErrorMessage(error, 'Failed to update contact') },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/contacts/[id]:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
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

    const id = parseId(params.id)
    if (id == null) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('Brizzle_contacts')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json(
        { error: contactDatabaseErrorMessage(error, 'Failed to delete contact') },
        { status: 500 }
      )
    }

    if (!data?.length) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/contacts/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
