import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { getWelcomeBookletTemplate } from '@/lib/onboarding-templates'
import {
  getChecklistItemDefinition,
  isTemplatePickUploadType,
  mergeChecklistWithRecords,
  type OnboardingChecklistItemRecord,
} from '@/lib/student-onboarding-checklist'
import { loadLinkedChecklistDocuments } from '@/lib/load-student-onboarding-checklist'
import { isMissingWorkflowStateColumn } from '@/lib/student-document-checklist'

async function deleteExistingWelcomeBooklet(studentId: string, checklistItemSlug: string) {
  const { data: existing } = await supabaseServer
    .from('StudentDocument')
    .select('id, fileUrl')
    .eq('studentId', studentId)
    .eq('checklistItemSlug', checklistItemSlug)

  for (const document of existing || []) {
    const fileUrl = decodeURIComponent(document.fileUrl || '')
    const pathMatch = fileUrl.match(/(student-docs\/[^?]+)/)
    const filePath = pathMatch ? pathMatch[1] : null

    if (filePath) {
      await supabaseServer.storage.from('resources').remove([filePath])
    }

    await supabaseServer.from('StudentDocument').delete().eq('id', document.id)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId, checklistItemSlug, templateKey } = await request.json()

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!checklistItemSlug || typeof checklistItemSlug !== 'string') {
      return NextResponse.json({ error: 'Checklist item is required' }, { status: 400 })
    }

    if (!templateKey || typeof templateKey !== 'string') {
      return NextResponse.json({ error: 'Template option is required' }, { status: 400 })
    }

    const checklistItem = getChecklistItemDefinition(checklistItemSlug)
    if (!checklistItem || !isTemplatePickUploadType(checklistItem.type)) {
      return NextResponse.json({ error: 'Invalid checklist item' }, { status: 400 })
    }

    const option = checklistItem.templatePickOptions?.find((entry) => entry.key === templateKey)
    const template = checklistItemSlug === 'welcome-booklet' ? getWelcomeBookletTemplate(templateKey) : null

    if (!option || !template) {
      return NextResponse.json({ error: 'Invalid template option' }, { status: 400 })
    }

    const { data: existingDocs } = await supabaseServer
      .from('StudentDocument')
      .select('studentNote')
      .eq('studentId', studentId)
      .eq('checklistItemSlug', checklistItemSlug)

    let preservedStudentNote: string | null = null
    for (const doc of existingDocs || []) {
      if (typeof doc.studentNote === 'string' && doc.studentNote.trim()) {
        preservedStudentNote = doc.studentNote
      }
    }

    const { data: student, error: studentError } = await supabaseServer
      .from('User')
      .select('id')
      .eq('id', studentId)
      .eq('role', 'STUDENT')
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const { data: fileBlob, error: downloadError } = await supabaseServer.storage
      .from(template.storageBucket)
      .download(template.storagePath)

    if (downloadError || !fileBlob) {
      console.error('Error downloading welcome booklet template:', downloadError)
      return NextResponse.json(
        {
          error: `Template PDF not found (${template.storageBucket}/${template.storagePath}).`,
        },
        { status: 404 }
      )
    }

    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer())
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const sanitizedName = template.publishFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const destPath = `student-docs/${studentId}/${timestamp}-${random}-${sanitizedName}`

    const { error: uploadError } = await supabaseServer.storage
      .from('resources')
      .upload(destPath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading welcome booklet for student:', uploadError)
      return NextResponse.json({ error: 'Failed to publish welcome booklet' }, { status: 500 })
    }

    await deleteExistingWelcomeBooklet(studentId, checklistItemSlug)

    const expiresIn = 365 * 24 * 60 * 60
    const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
      .from('resources')
      .createSignedUrl(destPath, expiresIn)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to prepare published document' }, { status: 500 })
    }

    const now = new Date().toISOString()
    const documentId = randomUUID()
    const documentTitle = checklistItem.documentTitle || 'Welcome booklet'

    const insertPayload: Record<string, unknown> = {
      id: documentId,
      studentId,
      title: documentTitle,
      fileName: template.publishFileName,
      fileUrl: signedUrlData.signedUrl,
      fileSize: fileBuffer.byteLength,
      mimeType: 'application/pdf',
      uploadedBy: session.user.id,
      checklistItemSlug,
      createdAt: now,
      updatedAt: now,
    }

    if (preservedStudentNote) {
      insertPayload.studentNote = preservedStudentNote
    }

    const { error: insertError } = await supabaseServer.from('StudentDocument').insert(insertPayload)

    if (insertError) {
      console.error('Error saving welcome booklet document:', insertError)
      await supabaseServer.storage.from('resources').remove([destPath])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    const workflowState = {
      selectedVariant: template.key,
      selectedVariantLabel: template.label,
    }

    const { data: checklistRecords } = await supabaseServer
      .from('StudentOnboardingChecklistItem')
      .select('*')
      .eq('studentId', studentId)

    const { data: existingWorkflow } = await supabaseServer
      .from('StudentOnboardingChecklistItem')
      .select('id')
      .eq('studentId', studentId)
      .eq('itemSlug', checklistItemSlug)
      .maybeSingle()

    if (existingWorkflow) {
      const { error: workflowError } = await supabaseServer
        .from('StudentOnboardingChecklistItem')
        .update({
          status: 'PENDING',
          workflowState,
          updatedBy: session.user.id,
          updatedAt: now,
        })
        .eq('id', existingWorkflow.id)

      if (workflowError && !isMissingWorkflowStateColumn(workflowError)) {
        console.error('Error updating welcome booklet workflow:', workflowError)
      }
    } else {
      const { error: workflowError } = await supabaseServer
        .from('StudentOnboardingChecklistItem')
        .insert({
          id: randomUUID(),
          studentId,
          itemSlug: checklistItemSlug,
          status: 'PENDING',
          note: null,
          workflowState,
          updatedBy: session.user.id,
          createdAt: now,
          updatedAt: now,
        })

      if (workflowError && !isMissingWorkflowStateColumn(workflowError)) {
        console.error('Error creating welcome booklet workflow:', workflowError)
      }
    }

    const linkedDocuments = await loadLinkedChecklistDocuments(studentId)
    const items = mergeChecklistWithRecords(
      (checklistRecords || []) as OnboardingChecklistItemRecord[],
      linkedDocuments
    )
    const item = items.find((entry) => entry.slug === checklistItemSlug)

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error in POST /api/onboarding-templates/publish:', error)
    return NextResponse.json({ error: 'Failed to publish template' }, { status: 500 })
  }
}
