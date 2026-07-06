import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { isBpfPeriodSlug, parseBpfEntryBody, type BpfPeriodSlug } from '@/lib/bpf'

async function requireTeacher() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') {
    return null
  }
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

    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseServer
      .from('Brizzle_bpf_entries')
      .select('period_slug')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const periodSlug = existing.period_slug as BpfPeriodSlug
    if (!isBpfPeriodSlug(periodSlug)) {
      return NextResponse.json({ error: 'Invalid stored period' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = parseBpfEntryBody({ ...body, period_slug: periodSlug }, periodSlug)
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error ?? 'Invalid entry' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('Brizzle_bpf_entries')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating BPF entry:', error)
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/bpf-entries/[id]:', error)
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
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

    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const { error } = await supabaseServer.from('Brizzle_bpf_entries').delete().eq('id', id)

    if (error) {
      console.error('Error deleting BPF entry:', error)
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/bpf-entries/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
