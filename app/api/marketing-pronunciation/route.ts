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

export async function GET() {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseServer
      .from('Brizzle_marketing_pronunciation')
      .select('*')
      .order('posted_date', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching marketing pronunciation rows:', error)
      return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Error in GET /api/marketing-pronunciation:', error)
    return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireTeacher())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const postedDate =
      typeof body.posted_date === 'string' && body.posted_date.trim()
        ? body.posted_date.trim()
        : new Date().toISOString().slice(0, 10)
    const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
    const supabaseUrl =
      typeof body.supabase_url === 'string' ? body.supabase_url.trim() : ''
    const slugInput = typeof body.slug === 'string' ? body.slug.trim() : ''
    const slug = slugInput || slugFromSupabaseAudioUrl(supabaseUrl) || ''

    if (!isValidMarketingSupabaseUrl(supabaseUrl)) {
      return NextResponse.json({ error: 'A valid Supabase audio URL is required' }, { status: 400 })
    }

    if (!isValidMarketingSlug(slug)) {
      return NextResponse.json(
        { error: 'Could not derive a valid slug. Check the Supabase URL or enter a slug manually.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await supabaseServer
      .from('Brizzle_marketing_pronunciation')
      .insert({
        posted_date: postedDate,
        topic,
        supabase_url: supabaseUrl,
        slug,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `The slug "${slug}" is already in use. Choose a different slug.` },
          { status: 409 }
        )
      }
      console.error('Error creating marketing pronunciation row:', error)
      return NextResponse.json({ error: 'Failed to create row' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/marketing-pronunciation:', error)
    return NextResponse.json({ error: 'Failed to create row' }, { status: 500 })
  }
}
