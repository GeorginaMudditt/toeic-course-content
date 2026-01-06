import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// GET: Fetch vocabulary progress for the current user (student) or all students (teacher)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const topic = searchParams.get('topic')
    const studentId = searchParams.get('studentId')

    // If studentId is provided, only teachers can access it
    const targetStudentId = studentId || session.user.id
    if (studentId && session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabaseServer
      .from('VocabularyProgress')
      .select('*')
      .eq('studentId', targetStudentId)

    if (level) {
      query = query.eq('level', level.toLowerCase())
    }
    if (topic) {
      // Normalize topic name for matching
      const normalizedTopic = decodeURIComponent(topic).trim().replace(/\s+/g, ' ')
      query = query.eq('topic', normalizedTopic)
    }

    const { data, error } = await query.order('updatedAt', { ascending: false })

    if (error) {
      console.error('Error fetching vocabulary progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [], error: null })
  } catch (error: any) {
    console.error('Error in vocabulary progress GET route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST: Save/update vocabulary progress for a student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let { level, topic, bronze, silver, gold } = body

    if (!level || !topic || typeof bronze !== 'boolean' || typeof silver !== 'boolean' || typeof gold !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Normalize topic name: trim and remove extra spaces (matching vocabulary API normalization)
    topic = topic.trim().replace(/\s+/g, ' ')
    const normalizedLevel = level.toLowerCase()
    
    // Explicitly convert to booleans to ensure they're not strings or other types
    bronze = Boolean(bronze)
    silver = Boolean(silver)
    gold = Boolean(gold)

    console.log('Vocabulary progress POST:', { studentId: session.user.id, level: normalizedLevel, topic, bronze, silver, gold })

    // Check if progress already exists
    // Use ilike for case-insensitive matching and trim for whitespace handling
    // First try exact match, then try case-insensitive match
    let { data: existing, error: checkError } = await supabaseServer
      .from('VocabularyProgress')
      .select('id, bronze, silver, gold, topic')
      .eq('studentId', session.user.id)
      .eq('level', normalizedLevel)
      .eq('topic', topic)
      .order('updatedAt', { ascending: false })
      .limit(1)
    
    // If no exact match, try to find by trimming and normalizing topic names
    if ((!existing || existing.length === 0) && !checkError) {
      console.log('No exact match found, trying normalized topic matching...')
      const { data: allRecords, error: fetchError } = await supabaseServer
        .from('VocabularyProgress')
        .select('id, bronze, silver, gold, topic')
        .eq('studentId', session.user.id)
        .eq('level', normalizedLevel)
      
      if (!fetchError && allRecords && allRecords.length > 0) {
        // Find a record where the normalized topic matches
        const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
        console.log('Searching', allRecords.length, 'records for topic:', normalizedTopic)
        const matchingRecords = allRecords.filter(record => {
          const recordTopic = (record.topic || '').trim().replace(/\s+/g, ' ')
          const matches = recordTopic === normalizedTopic
          if (matches) {
            console.log('Found match! Record topic:', recordTopic, 'matches normalized:', normalizedTopic)
          }
          return matches
        })
        if (matchingRecords.length > 0) {
          existing = matchingRecords
          console.log('Found existing progress using normalized topic matching:', existing[0])
        } else {
          console.log('No matching records found. All topics in DB:', allRecords.map(r => `"${r.topic}"`))
        }
      } else if (fetchError) {
        console.error('Error fetching all records for fallback search:', fetchError)
      }
    }

    if (checkError) {
      console.error('Error checking existing progress:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // Ensure existing is an array
    if (!Array.isArray(existing)) {
      existing = existing ? [existing] : []
    }

    console.log('Existing progress found:', existing, 'Length:', existing?.length)

    const completedAt = bronze && silver && gold ? new Date().toISOString() : null

    if (existing && existing.length > 0) {
      // Update existing record - ensure we preserve all values
      // Explicitly set all boolean values to ensure they're updated correctly
      const existingRecord = existing[0]
      const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
      const updateData = {
        topic: normalizedTopic, // Normalize topic name in database too
        bronze: Boolean(bronze),
        silver: Boolean(silver),
        gold: Boolean(gold),
        completedAt,
        updatedAt: new Date().toISOString()
      }
      console.log('Updating progress with:', updateData)
      console.log('Existing progress before update:', existingRecord)
      console.log('Updating record with ID:', existingRecord.id)
      console.log('Topic name - incoming:', topic, 'normalized:', normalizedTopic, 'existing:', existingRecord.topic)
      
      const { data, error } = await supabaseServer
        .from('VocabularyProgress')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select('*')
        .order('updatedAt', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error updating vocabulary progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('Progress updated successfully:', data?.[0])
      // Verify the update worked by checking the returned data
      if (data && data[0]) {
        const updated = data[0]
        console.log('Verification - Updated values:', {
          bronze: updated.bronze,
          silver: updated.silver,
          gold: updated.gold,
          bronzeType: typeof updated.bronze,
          silverType: typeof updated.silver,
          goldType: typeof updated.gold
        })
      }
      return NextResponse.json({ data: data?.[0] || null, error: null })
    } else {
      // Create new record - ensure topic is normalized
      const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
      const now = new Date().toISOString()
      const insertData = {
        id: randomUUID(),
        studentId: session.user.id,
        level: normalizedLevel,
        topic: normalizedTopic, // Use normalized topic
        bronze: Boolean(bronze),
        silver: Boolean(silver),
        gold: Boolean(gold),
        completedAt,
        createdAt: now,
        updatedAt: now
      }
      console.log('Creating new progress record with:', insertData)
      
      const { data, error } = await supabaseServer
        .from('VocabularyProgress')
        .insert(insertData)
        .select('*')
        .order('updatedAt', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error creating vocabulary progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('Progress created successfully:', data?.[0])
      return NextResponse.json({ data: data?.[0] || null, error: null })
    }
  } catch (error: any) {
    console.error('Error in vocabulary progress POST route:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
