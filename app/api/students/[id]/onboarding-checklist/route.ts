import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import {
  getChecklistItemDefinition,
  isDualDocumentOrNaType,
  isValidOnboardingChecklistSlug,
  isValidOnboardingChecklistStatus,
  mergeChecklistWithRecords,
  parseTemplateWorkflowState,
  type OnboardingChecklistItemRecord,
  type TemplateWorkflowState,
  isTemplateWorkflowType,
} from '@/lib/student-onboarding-checklist'
import { loadLinkedChecklistDocuments } from '@/lib/load-student-onboarding-checklist'
import { isMissingWorkflowStateColumn } from '@/lib/student-document-checklist'
import { getOnboardingTemplateVariant } from '@/lib/onboarding-templates'

async function deleteChecklistLinkedDocuments(studentId: string, itemSlug: string) {
  const { data: documents } = await supabaseServer
    .from('StudentDocument')
    .select('id, fileUrl')
    .eq('studentId', studentId)
    .eq('checklistItemSlug', itemSlug)

  for (const document of documents || []) {
    const fileUrl = decodeURIComponent(document.fileUrl || '')
    const pathMatch = fileUrl.match(/(student-docs\/[^?]+)/)
    const storagePath = pathMatch ? pathMatch[1] : null

    if (storagePath) {
      await supabaseServer.storage.from('resources').remove([storagePath])
    }

    await supabaseServer.from('StudentDocument').delete().eq('id', document.id)
  }
}

async function verifyStudent(studentId: string) {
  const { data, error } = await supabaseServer
    .from('User')
    .select('id, name, role')
    .eq('id', studentId)
    .eq('role', 'STUDENT')
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function attachSignedFileUrls(records: OnboardingChecklistItemRecord[]) {
  const expiresIn = 365 * 24 * 60 * 60

  return Promise.all(
    records.map(async (record) => {
      if (!record.filePath) {
        return record
      }

      const { data: signedUrlData } = await supabaseServer.storage
        .from('resources')
        .createSignedUrl(record.filePath, expiresIn)

      return {
        ...record,
        fileUrl: signedUrlData?.signedUrl || record.fileUrl,
      }
    })
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await verifyStudent(params.id)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const [{ data, error }, linkedDocumentsBySlug] = await Promise.all([
      supabaseServer
        .from('StudentOnboardingChecklistItem')
        .select('*')
        .eq('studentId', params.id),
      loadLinkedChecklistDocuments(params.id),
    ])

    if (error) {
      console.error('Error fetching onboarding checklist:', error)
      return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
    }

    const records = await attachSignedFileUrls((data || []) as OnboardingChecklistItemRecord[])
    const items = mergeChecklistWithRecords(records, linkedDocumentsBySlug)

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      items,
    })
  } catch (error) {
    console.error('Error in GET /api/students/[id]/onboarding-checklist:', error)
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await verifyStudent(params.id)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      itemSlug,
      status,
      note,
      fileName,
      filePath,
      fileSize,
      mimeType,
      clearFile,
      workflowUpdate,
      templateVariant,
    } = body

    if (!itemSlug || typeof itemSlug !== 'string' || !isValidOnboardingChecklistSlug(itemSlug)) {
      return NextResponse.json({ error: 'Invalid checklist item' }, { status: 400 })
    }

    const itemDefinition = getChecklistItemDefinition(itemSlug)

    if (workflowUpdate && itemDefinition && isTemplateWorkflowType(itemDefinition.type)) {
      const now = new Date().toISOString()
      const { data: existing, error: existingError } = await supabaseServer
        .from('StudentOnboardingChecklistItem')
        .select('id, workflowState')
        .eq('studentId', params.id)
        .eq('itemSlug', itemSlug)
        .maybeSingle()

      if (existingError && !isMissingWorkflowStateColumn(existingError)) {
        console.error('Error loading checklist workflow:', existingError)
        return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
      }

      const currentState = parseTemplateWorkflowState(existing?.workflowState)
      const nextState: TemplateWorkflowState = { ...currentState }

      if (workflowUpdate === 'templateDownloaded') {
        nextState.templateDownloadedAt = now
        if (typeof templateVariant === 'string') {
          nextState.templateVariant = templateVariant
          const variant = getOnboardingTemplateVariant(itemSlug, templateVariant)
          nextState.templateVariantLabel = variant?.label ?? templateVariant
        }
      } else if (workflowUpdate === 'formPrepared') {
        nextState.formPreparedAt = now
      } else if (workflowUpdate === 'resetWorkflow') {
        nextState.templateDownloadedAt = null
        nextState.templateVariant = null
        nextState.templateVariantLabel = null
        nextState.formPreparedAt = null
      } else {
        return NextResponse.json({ error: 'Invalid workflow update' }, { status: 400 })
      }

      const basePayload = {
        status: 'PENDING' as const,
        note: null,
        completedAt: null,
        updatedBy: session.user.id,
        updatedAt: now,
      }

      let savedRecord

      if (existing) {
        const { data, error } = await supabaseServer
          .from('StudentOnboardingChecklistItem')
          .update({ ...basePayload, workflowState: nextState })
          .eq('id', existing.id)
          .select('*')
          .single()

        if (error && isMissingWorkflowStateColumn(error)) {
          return NextResponse.json(
            {
              error:
                'Workflow tracking is not enabled yet. Run supabase-migration-checklist-workflow-state.sql in Supabase.',
            },
            { status: 500 }
          )
        }

        if (error) {
          console.error('Error updating checklist workflow:', error)
          return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
        }

        savedRecord = data
      } else {
        const { data, error } = await supabaseServer
          .from('StudentOnboardingChecklistItem')
          .insert({
            id: randomUUID(),
            studentId: params.id,
            itemSlug,
            ...basePayload,
            workflowState: nextState,
            createdAt: now,
          })
          .select('*')
          .single()

        if (error && isMissingWorkflowStateColumn(error)) {
          return NextResponse.json(
            {
              error:
                'Workflow tracking is not enabled yet. Run supabase-migration-checklist-workflow-state.sql in Supabase.',
            },
            { status: 500 }
          )
        }

        if (error) {
          console.error('Error creating checklist workflow:', error)
          return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
        }

        savedRecord = data
      }

      const linkedDocumentsBySlug = await loadLinkedChecklistDocuments(params.id)
      const mergedItems = mergeChecklistWithRecords(
        [savedRecord as OnboardingChecklistItemRecord],
        linkedDocumentsBySlug
      )
      const item = mergedItems.find((entry) => entry.slug === itemSlug)

      if (!item) {
        return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
      }

      return NextResponse.json({ success: true, item })
    }

    if (!status || typeof status !== 'string' || !isValidOnboardingChecklistStatus(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const completedAt =
      status === 'COMPLETED' || status === 'NOT_APPLICABLE' ? now : null

    if (
      status === 'NOT_APPLICABLE' &&
      itemDefinition &&
      isDualDocumentOrNaType(itemDefinition.type)
    ) {
      await deleteChecklistLinkedDocuments(params.id, itemSlug)
    }

    let fileUrl: string | null = null
    if (status === 'COMPLETED' && filePath && typeof filePath === 'string') {
      const expiresIn = 365 * 24 * 60 * 60
      const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
        .from('resources')
        .createSignedUrl(filePath, expiresIn)

      if (signedUrlError) {
        console.error('Error creating signed URL for checklist file:', signedUrlError)
        return NextResponse.json({ error: 'Uploaded file not found in storage' }, { status: 400 })
      }

      fileUrl = signedUrlData.signedUrl
    }

    const { data: existing, error: existingError } = await supabaseServer
      .from('StudentOnboardingChecklistItem')
      .select('id, filePath')
      .eq('studentId', params.id)
      .eq('itemSlug', itemSlug)
      .maybeSingle()

    if (existingError) {
      console.error('Error loading checklist item:', existingError)
      return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
    }

    const noteValue =
      status === 'COMPLETED' && typeof note === 'string' ? note.trim() || null : null

    const updatePayload: Record<string, unknown> = {
      status,
      note: status === 'COMPLETED' ? noteValue : null,
      completedAt,
      updatedBy: session.user.id,
      updatedAt: now,
    }

    if (status !== 'COMPLETED' || clearFile) {
      updatePayload.fileName = null
      updatePayload.filePath = null
      updatePayload.fileUrl = null
      updatePayload.fileSize = null
      updatePayload.mimeType = null
    } else if (filePath) {
      updatePayload.fileName = typeof fileName === 'string' ? fileName : null
      updatePayload.filePath = filePath
      updatePayload.fileUrl = fileUrl
      updatePayload.fileSize = typeof fileSize === 'number' ? fileSize : null
      updatePayload.mimeType = typeof mimeType === 'string' ? mimeType : null
    }

    let savedRecord

    if (existing) {
      const { data, error } = await supabaseServer
        .from('StudentOnboardingChecklistItem')
        .update(updatePayload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating checklist item:', error)
        return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
      }

      savedRecord = data
    } else {
      const { data, error } = await supabaseServer
        .from('StudentOnboardingChecklistItem')
        .insert({
          id: randomUUID(),
          studentId: params.id,
          itemSlug,
          ...updatePayload,
          createdAt: now,
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error creating checklist item:', error)
        return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
      }

      savedRecord = data
    }

    const [recordWithUrl] = await attachSignedFileUrls([
      savedRecord as OnboardingChecklistItemRecord,
    ])
    const linkedDocumentsBySlug = await loadLinkedChecklistDocuments(params.id)
    const mergedItems = mergeChecklistWithRecords([recordWithUrl], linkedDocumentsBySlug)
    const item = mergedItems.find((entry) => entry.slug === itemSlug)

    if (!item) {
      return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
    }

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('Error in PATCH /api/students/[id]/onboarding-checklist:', error)
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
  }
}
