import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import {
  STUDENT_UPLOAD_LEVELS,
  STUDENT_UPLOAD_SKILLS,
  buildStudentPdfContent,
  studentPdfStoragePrefix,
} from '@/lib/student-uploaded-resource'
import { verifyTeacherEnrollment } from '@/lib/verify-teacher-enrollment'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const enrollmentId = String(body.enrollmentId || '').trim()
    const title = String(body.title || '').trim()
    const level = String(body.level || '').trim()
    const skill = String(body.skill || '').trim()
    const storagePath = String(body.storagePath || '').trim()
    const fileName = String(body.fileName || '').trim()

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Choose a course for this document.' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Enter a title.' }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or fewer.' }, { status: 400 })
    }
    if (!STUDENT_UPLOAD_LEVELS.includes(level as (typeof STUDENT_UPLOAD_LEVELS)[number])) {
      return NextResponse.json({ error: 'Choose a level.' }, { status: 400 })
    }
    if (!STUDENT_UPLOAD_SKILLS.some((option) => option.value === skill)) {
      return NextResponse.json({ error: 'Choose a category.' }, { status: 400 })
    }
    if (!storagePath.startsWith(studentPdfStoragePrefix(enrollmentId)) || storagePath.includes('..')) {
      return NextResponse.json({ error: 'The uploaded file could not be found.' }, { status: 400 })
    }

    const enrollment = await verifyTeacherEnrollment(enrollmentId, session.user.id)
    if (!enrollment.ok) {
      return NextResponse.json({ error: enrollment.error }, { status: enrollment.status })
    }

    const { data: urlData } = supabaseServer.storage.from('resources').getPublicUrl(storagePath)
    const now = new Date().toISOString()
    const resourceId = randomUUID()

    const { error: resourceError } = await supabaseServer.from('Resource').insert({
      id: resourceId,
      title,
      description: null,
      type: 'WORKSHEET',
      content: buildStudentPdfContent({
        pdfUrl: urlData.publicUrl,
        storagePath,
        fileName: fileName || 'document.pdf',
      }),
      estimatedHours: 1,
      level,
      skill,
      creatorId: session.user.id,
      createdAt: now,
      updatedAt: now,
    })

    if (resourceError) {
      console.error('Error creating student PDF resource:', resourceError)
      await supabaseServer.storage.from('resources').remove([storagePath])
      return NextResponse.json(
        { error: resourceError.message || 'Failed to save the document.' },
        { status: 500 },
      )
    }

    const { data: maxOrderData } = await supabaseServer
      .from('Assignment')
      .select('order')
      .eq('enrollmentId', enrollmentId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = maxOrderData?.order ? (maxOrderData.order as number) + 1 : 1

    const { data: assignment, error: assignmentError } = await supabaseServer
      .from('Assignment')
      .insert({
        id: randomUUID(),
        enrollmentId,
        resourceId,
        order: nextOrder,
        assignedAt: now,
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Error assigning student PDF:', assignmentError)
      await supabaseServer.from('Resource').delete().eq('id', resourceId)
      await supabaseServer.storage.from('resources').remove([storagePath])
      return NextResponse.json(
        { error: assignmentError.message || 'Failed to add the document to this student.' },
        { status: 500 },
      )
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error saving student document:', error)
    const message = error instanceof Error ? error.message : 'Failed to save the document.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
