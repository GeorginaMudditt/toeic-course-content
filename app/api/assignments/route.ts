import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enrollmentId, resourceIds } = await request.json()

    // Verify enrollment belongs to teacher's course
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true }
    })

    if (!enrollment || enrollment.course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current max order
    const maxOrder = await prisma.assignment.findFirst({
      where: { enrollmentId },
      orderBy: { order: 'desc' }
    })

    let nextOrder = (maxOrder?.order || 0) + 1

    // Create assignments
    const assignments = await Promise.all(
      resourceIds.map((resourceId: string) =>
        prisma.assignment.create({
          data: {
            enrollmentId,
            resourceId,
            order: nextOrder++
          }
        })
      )
    )

    return NextResponse.json(assignments)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'One or more resources are already assigned' },
        { status: 400 }
      )
    }
    console.error('Error creating assignments:', error)
    return NextResponse.json(
      { error: 'Failed to create assignments' },
      { status: 500 }
    )
  }
}

