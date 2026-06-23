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
      return NextResponse.json({ data: [], error: null })
    }

    const { vocab } = VOCABULARY_TABLES[level]

    const { data, error } = await supabaseServer
      .from(vocab)
      .select('topic_page')
      .order('topic_page', { ascending: true })

    if (error) {
      console.error('Error fetching vocabulary topics:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data || []).filter((row: any) => !!row.topic_page)
    const topicToCount = new Map<string, number>()
    const topicToOriginalName = new Map<string, string>()

    for (const row of rows) {
      const normalizedKey = row.topic_page.trim().replace(/\s+/g, ' ').toLowerCase()
      const originalName = row.topic_page.trim().replace(/\s+/g, ' ')

      topicToCount.set(normalizedKey, (topicToCount.get(normalizedKey) || 0) + 1)
      if (!topicToOriginalName.has(normalizedKey)) {
        topicToOriginalName.set(normalizedKey, originalName)
      }
    }

    const topicsWithCounts = Array.from(topicToCount.entries())
      .map(([normalizedName, count]) => ({
        name: topicToOriginalName.get(normalizedName) || normalizedName,
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ data: topicsWithCounts, error: null })
  } catch (error: any) {
    console.error('Error in vocabulary API route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
