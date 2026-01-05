import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notes, status } = await request.json()

    // Verify assignment belongs to student
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      include: { enrollment: true }
    })

    if (!assignment || assignment.enrollment.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert progress
    const progress = await prisma.progress.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: params.assignmentId,
          studentId: session.user.id
        }
      },
      update: {
        notes,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        assignmentId: params.assignmentId,
        studentId: session.user.id,
        notes,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error saving progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}


