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
      return NextResponse.json({ data: [], error: null })
    }

    // Fetch distinct topic_page values from the A1 table using service role key
    const { data, error } = await supabaseServer
      .from('Brizzle_A1_vocab')
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
      // Normalize the topic name for grouping: trim whitespace, remove extra spaces, lowercase
      const normalizedKey = row.topic_page.trim().replace(/\s+/g, ' ').toLowerCase()
      const originalName = row.topic_page.trim().replace(/\s+/g, ' ')
      
      // Store the count
      topicToCount.set(normalizedKey, (topicToCount.get(normalizedKey) || 0) + 1)
      // Store the original name (use the first occurrence as the display name)
      if (!topicToOriginalName.has(normalizedKey)) {
        topicToOriginalName.set(normalizedKey, originalName)
      }
    }
    
    const topicsWithCounts = Array.from(topicToCount.entries())
      .map(([normalizedName, count]) => ({ 
        name: topicToOriginalName.get(normalizedName) || normalizedName, 
        count 
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ data: topicsWithCounts, error: null })
  } catch (error: any) {
    console.error('Error in vocabulary API route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
