import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  isValidMarketingSlug,
  isValidMarketingSupabaseUrl,
  slugFromSupabaseAudioUrl,
} from '@/lib/marketing-pronunciation'

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

    const body = await request.json()
    const updates: Record<string, string> = {}

    if (typeof body.posted_date === 'string' && body.posted_date.trim()) {
      updates.posted_date = body.posted_date.trim()
    }
    if (typeof body.topic === 'string') {
      updates.topic = body.topic.trim()
    }
    if (typeof body.supabase_url === 'string') {
      const supabaseUrl = body.supabase_url.trim()
      if (!isValidMarketingSupabaseUrl(supabaseUrl)) {
        return NextResponse.json({ error: 'A valid Supabase audio URL is required' }, { status: 400 })
      }
      updates.supabase_url = supabaseUrl
    }
    if (typeof body.slug === 'string') {
      const slug = body.slug.trim()
      if (!isValidMarketingSlug(slug)) {
        return NextResponse.json({ error: 'Slug must use lowercase letters, numbers, and hyphens only' }, { status: 400 })
      }
      updates.slug = slug
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    if (!updates.slug && updates.supabase_url) {
      const derived = slugFromSupabaseAudioUrl(updates.supabase_url)
      if (derived && isValidMarketingSlug(derived)) {
        updates.slug = derived
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseServer
      .from('Brizzle_marketing_pronunciation')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 })
      }
      console.error('Error updating marketing pronunciation row:', error)
      return NextResponse.json({ error: 'Failed to update row' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/marketing-pronunciation/[id]:', error)
    return NextResponse.json({ error: 'Failed to update row' }, { status: 500 })
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

    const { error } = await supabaseServer
      .from('Brizzle_marketing_pronunciation')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting marketing pronunciation row:', error)
      return NextResponse.json({ error: 'Failed to delete row' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/marketing-pronunciation/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete row' }, { status: 500 })
  }
}
