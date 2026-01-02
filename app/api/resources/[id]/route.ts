import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use Supabase REST API instead of Prisma for serverless compatibility
    const { data: resource, error } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching resource:', error)
      return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 })
    }

    if (!resource || resource.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error fetching resource:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Verify resource belongs to teacher using Supabase REST API
    const { data: existingResource, error: checkError } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('id', params.id)
      .single()

    if (checkError) {
      console.error('Error checking resource:', checkError)
      return NextResponse.json({ error: 'Failed to verify resource' }, { status: 500 })
    }

    if (!existingResource || existingResource.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update resource using Supabase REST API
    const { data: resource, error: updateError } = await supabaseServer
      .from('Resource')
      .update({
        title: data.title,
        description: data.description || null,
        type: data.type,
        content: data.content,
        estimatedHours: data.estimatedHours,
        level: data.level,
        tags: data.tags || null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating resource:', updateError)
      return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify resource belongs to teacher using Supabase REST API
    const { data: existingResource, error: checkError } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('id', params.id)
      .single()

    if (checkError) {
      console.error('Error checking resource:', checkError)
      return NextResponse.json({ error: 'Failed to verify resource' }, { status: 500 })
    }

    if (!existingResource || existingResource.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete resource using Supabase REST API
    const { error: deleteError } = await supabaseServer
      .from('Resource')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting resource:', deleteError)
      return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}
