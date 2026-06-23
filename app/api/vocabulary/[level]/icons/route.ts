import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { isVocabularyLevel, VOCABULARY_TABLES } from '@/lib/vocabulary-levels'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const level = params.level.toLowerCase()

    if (!isVocabularyLevel(level)) {
      return NextResponse.json({ data: {}, error: null })
    }

    const { icons } = VOCABULARY_TABLES[level]

    const { data, error } = await supabaseServer
      .from(icons)
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
