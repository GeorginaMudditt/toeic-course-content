import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import {
  STUDENT_UPLOAD_LEVELS,
  STUDENT_UPLOAD_SKILLS,
  buildStudentPdfContent,
} from '@/lib/student-uploaded-resource'

const MAX_PDF_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const enrollmentId = String(formData.get('enrollmentId') || '').trim()
    const title = String(formData.get('title') || '').trim()
    const level = String(formData.get('level') || '').trim()
    const skill = String(formData.get('skill') || '').trim()
    const file = formData.get('file')

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
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Choose a PDF to upload.' }, { status: 400 })
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files can be uploaded here.' }, { status: 400 })
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF must be 10MB or smaller.' }, { status: 400 })
    }

    const { data: enrollment, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('id, courseId')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Course enrollment not found.' }, { status: 404 })
    }

    const { data: course, error: courseError } = await supabaseServer
      .from('Course')
      .select('id, creatorId')
      .eq('id', enrollment.courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    }
    if (course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${timestamp}-${random}-${sanitizedName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseServer.storage
      .from('resources')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading student PDF:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload the PDF.' },
        { status: 500 },
      )
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
        fileName: file.name,
      }),
      estimatedHours: 0,
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
    console.error('Error uploading student document:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload the document.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
