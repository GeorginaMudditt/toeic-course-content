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

    const { studentId, courseId } = await request.json()

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course || course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId
      }
    })

    return NextResponse.json(enrollment)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Student is already enrolled in this course' },
        { status: 400 }
      )
    }
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}

