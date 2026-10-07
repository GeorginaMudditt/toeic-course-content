import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import {
  isStudentUploadedResource,
  studentUploadedStoragePath,
} from '@/lib/student-uploaded-resource'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        enrollment: {
          include: { course: true }
        }
      }
    })

    if (!assignment || assignment.enrollment.course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: uploadedResource } = await supabaseServer
      .from('Resource')
      .select('id, content, creatorId')
      .eq('id', assignment.resourceId)
      .maybeSingle()

    await prisma.assignment.delete({
      where: { id: params.id }
    })

    if (
      uploadedResource &&
      uploadedResource.creatorId === session.user.id &&
      isStudentUploadedResource(uploadedResource.content)
    ) {
      const storagePath = studentUploadedStoragePath(uploadedResource.content)
      const { error: resourceDeleteError } = await supabaseServer
        .from('Resource')
        .delete()
        .eq('id', uploadedResource.id)

      if (resourceDeleteError) {
        console.error('Error deleting uploaded student document:', resourceDeleteError)
      } else if (storagePath) {
        const { error: storageDeleteError } = await supabaseServer.storage
          .from('resources')
          .remove([storagePath])
        if (storageDeleteError) {
          console.error('Error deleting uploaded student PDF file:', storageDeleteError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}


