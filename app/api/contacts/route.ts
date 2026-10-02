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

export async function GET() {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseServer
      .from('Brizzle_contacts')
      .select('*')
      .order('name', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json(
        { error: contactDatabaseErrorMessage(error, 'Failed to fetch contacts') },
        { status: 500 }
      )
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in GET /api/contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = parseContactBody(await request.json())
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Invalid contact' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabaseServer
      .from('Brizzle_contacts')
      .insert({ ...parsed.data, updated_at: now })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json(
        { error: contactDatabaseErrorMessage(error, 'Failed to create contact') },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contacts:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
