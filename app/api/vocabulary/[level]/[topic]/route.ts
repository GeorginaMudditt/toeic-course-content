import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string; topic: string } }
) {
  try {
    const level = params.level.toLowerCase()
    const topic = decodeURIComponent(params.topic)

    // Only A1 is currently available
    if (level !== 'a1') {
      return NextResponse.json({ data: [], error: null })
    }

    // Normalize topic name for matching (trim and remove extra spaces)
    const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
    
    // Fetch words from Brizzle_A1_vocab using service role key
    const { data, error } = await supabaseServer
      .from('Brizzle_A1_vocab')
      .select('word_english, pron_english, translation_french, created_at, id')
      .eq('topic_page', normalizedTopic)

    if (error) {
      console.error('Error fetching vocabulary words:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audio URLs for debugging
    if (data && data.length > 0) {
      console.log(`Fetched ${data.length} words for topic: "${normalizedTopic}"`)
      const wordsWithAudio = data.filter((item: any) => item.pron_english)
      const wordsWithoutAudio = data.filter((item: any) => !item.pron_english)
      console.log(`Words with audio: ${wordsWithAudio.length}, without: ${wordsWithoutAudio.length}`)
      
      // Log sample audio URLs to check format
      if (wordsWithAudio.length > 0) {
        console.log('Sample audio URLs:', wordsWithAudio.slice(0, 3).map((w: any) => ({
          word: w.word_english,
          url: w.pron_english,
          urlType: w.pron_english?.startsWith('http') ? 'absolute' : w.pron_english?.startsWith('/') ? 'relative' : 'other'
        })))
      }
    }

    // Sort the data
    const sorted = (data || []).slice().sort((a: any, b: any) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (a.id !== undefined && b.id !== undefined) {
        return String(a.id).localeCompare(String(b.id))
      }
      return 0
    })

    return NextResponse.json({ data: sorted, error: null })
  } catch (error: any) {
    console.error('Error in vocabulary words API route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
