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

    console.log('Vocabulary progress POST:', { studentId: session.user.id, level: normalizedLevel, topic, bronze, silver, gold })

    // Check if progress already exists
    const { data: existing, error: checkError } = await supabaseServer
      .from('VocabularyProgress')
      .select('id, bronze, silver, gold')
      .eq('studentId', session.user.id)
      .eq('level', normalizedLevel)
      .eq('topic', topic)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing progress:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    console.log('Existing progress found:', existing)

    const completedAt = bronze && silver && gold ? new Date().toISOString() : null

    if (existing && existing.length > 0) {
      // Update existing record - ensure we preserve all values
      const updateData = {
        bronze,
        silver,
        gold,
        completedAt,
        updatedAt: new Date().toISOString()
      }
      console.log('Updating progress with:', updateData)
      
      const { data, error } = await supabaseServer
        .from('VocabularyProgress')
        .update(updateData)
        .eq('id', existing[0].id)
        .select('*')
        .limit(1)

      if (error) {
        console.error('Error updating vocabulary progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('Progress updated successfully:', data?.[0])
      return NextResponse.json({ data: data?.[0] || null, error: null })
    } else {
      // Create new record
      const insertData = {
        id: randomUUID(),
        studentId: session.user.id,
        level: normalizedLevel,
        topic,
        bronze,
        silver,
        gold,
        completedAt
      }
      console.log('Creating new progress record with:', insertData)
      
      const { data, error } = await supabaseServer
        .from('VocabularyProgress')
        .insert(insertData)
        .select('*')
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
