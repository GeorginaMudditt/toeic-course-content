import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Use Supabase REST API instead of Prisma for serverless compatibility
    const { data: resource, error } = await supabaseServer
      .from('Resource')
      .insert({
        title: data.title,
        description: data.description || null,
        type: data.type,
        content: data.content,
        estimatedHours: data.estimatedHours,
        level: data.level,
        tags: data.tags || null,
        creatorId: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating resource:', error)
      return NextResponse.json(
        { error: `Failed to create resource: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error creating resource:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create resource: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Supabase REST API instead of Prisma for serverless compatibility
    const { data: resources, error } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('creatorId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching resources:', error)
      return NextResponse.json(
        { error: `Failed to fetch resources: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(resources || [])
  } catch (error) {
    console.error('Error fetching resources:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch resources: ${errorMessage}` },
      { status: 500 }
    )
  }
}

