import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const level = params.level.toLowerCase()

    // Only A1 is currently available
    if (level !== 'a1') {
      return NextResponse.json({ data: {}, error: null })
    }

    // Fetch icons from Brizzle_A1_icons using service role key
    const { data, error } = await supabaseServer
      .from('Brizzle_A1_icons')
      .select('topic_page, icon')

    if (error) {
      console.error('Error fetching vocabulary icons:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const iconMap: Record<string, string> = {}
    ;(data || []).forEach((row: any) => {
      if (row.topic_page && row.icon) {
        iconMap[row.topic_page] = row.icon
      }
    })

    return NextResponse.json({ data: iconMap, error: null })
  } catch (error: any) {
    console.error('Error in vocabulary icons API route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
