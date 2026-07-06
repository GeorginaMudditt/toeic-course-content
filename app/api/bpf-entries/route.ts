import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { isBpfPeriodSlug, parseBpfEntryBody } from '@/lib/bpf'

async function requireTeacher() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const periodSlug = request.nextUrl.searchParams.get('period')
    let query = supabaseServer.from('Brizzle_bpf_entries').select('*')

    if (periodSlug) {
      if (!isBpfPeriodSlug(periodSlug)) {
        return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
      }
      query = query.eq('period_slug', periodSlug)
    }

    const { data, error } = await query
      .order('start_date', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching BPF entries:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in GET /api/bpf-entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const periodSlug = typeof body.period_slug === 'string' ? body.period_slug : ''
    if (!isBpfPeriodSlug(periodSlug)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }

    const parsed = parseBpfEntryBody(body, periodSlug)
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Invalid entry' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabaseServer
      .from('Brizzle_bpf_entries')
      .insert({ ...parsed.data, updated_at: now })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating BPF entry:', error)
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bpf-entries:', error)
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}
