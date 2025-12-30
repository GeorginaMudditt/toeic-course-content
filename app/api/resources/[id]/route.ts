import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: params.id }
    })

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

    // Verify resource belongs to teacher
    const existingResource = await prisma.resource.findUnique({
      where: { id: params.id }
    })

    if (!existingResource || existingResource.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        content: data.content,
        estimatedHours: data.estimatedHours,
        level: data.level,
        tags: data.tags || null
      }
    })

    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}

