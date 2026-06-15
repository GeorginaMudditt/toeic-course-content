import { supabaseServer } from '@/lib/supabase'
import {
  getChecklistSlugAndSlotForDocumentTitle,
  isMissingChecklistItemSlugColumn,
  isMissingStudentNoteColumn,
} from '@/lib/student-document-checklist'
import {
  getLinkedDocumentMapKey,
  mergeChecklistWithRecords,
  type LinkedStudentDocument,
  type OnboardingChecklistItemRecord,
  type OnboardingChecklistItemView,
} from '@/lib/student-onboarding-checklist'

async function refreshDocumentUrl(fileUrl: string | null) {
  if (!fileUrl) return fileUrl

  const fileUrlDecoded = decodeURIComponent(fileUrl)
  const pathMatch = fileUrlDecoded.match(/(student-docs\/[^?]+)/)
  const filePath = pathMatch ? pathMatch[1] : null

  if (!filePath) {
    return fileUrl
  }

  const expiresIn = 365 * 24 * 60 * 60
  const { data: signedUrlData } = await supabaseServer.storage
    .from('resources')
    .createSignedUrl(filePath, expiresIn)

  return signedUrlData?.signedUrl || fileUrl
}

async function mapDocumentToLinkedEntry(
  document: {
    id: string
    fileName: string
    fileUrl: string
    createdAt: string
    title?: string
    checklistItemSlug?: string | null
    studentNote?: string | null
  },
  slug: string
): Promise<[string, LinkedStudentDocument]> {
  const fileUrl = await refreshDocumentUrl(document.fileUrl)
  return [
    slug,
    {
      id: document.id,
      fileName: document.fileName,
      fileUrl: fileUrl || document.fileUrl,
      createdAt: document.createdAt,
      studentNote: document.studentNote ?? null,
    },
  ]
}

export async function loadLinkedChecklistDocuments(
  studentId: string
): Promise<Map<string, LinkedStudentDocument>> {
  const linkedDocuments = new Map<string, LinkedStudentDocument>()

  const setLinkedDocument = async (
    document: {
      id: string
      fileName: string
      fileUrl: string
      createdAt: string
      title?: string
      checklistItemSlug?: string | null
      studentNote?: string | null
    },
    slug: string,
    slotKey?: string
  ) => {
    const [, entry] = await mapDocumentToLinkedEntry(document, slug)
    linkedDocuments.set(getLinkedDocumentMapKey(slug, slotKey), entry)
  }

  const { data, error } = await supabaseServer
    .from('StudentDocument')
    .select('id, checklistItemSlug, title, fileName, fileUrl, createdAt, studentNote')
    .eq('studentId', studentId)
    .not('checklistItemSlug', 'is', null)

  if (error && isMissingStudentNoteColumn(error)) {
    const { data: basicData, error: basicError } = await supabaseServer
      .from('StudentDocument')
      .select('id, checklistItemSlug, title, fileName, fileUrl, createdAt')
      .eq('studentId', studentId)
      .not('checklistItemSlug', 'is', null)

    if (!basicError && basicData) {
      for (const document of basicData) {
        if (!document.checklistItemSlug) continue
        const mapping = getChecklistSlugAndSlotForDocumentTitle(document.title)
        const slotKey =
          mapping && mapping.slug === document.checklistItemSlug && mapping.slotKey
            ? mapping.slotKey
            : undefined
        await setLinkedDocument({ ...document, studentNote: null }, document.checklistItemSlug, slotKey)
      }
      return linkedDocuments
    }
  }

  if (!error && data) {
    for (const document of data) {
      if (!document.checklistItemSlug) continue
      const mapping = getChecklistSlugAndSlotForDocumentTitle(document.title)
      const slotKey =
        mapping && mapping.slug === document.checklistItemSlug && mapping.slotKey
          ? mapping.slotKey
          : undefined
      await setLinkedDocument(document, document.checklistItemSlug, slotKey)
    }
    return linkedDocuments
  }

  if (!isMissingChecklistItemSlugColumn(error)) {
    console.error('Error loading checklist-linked documents:', error)
    return linkedDocuments
  }

  const { data: documentsByTitle, error: titleError } = await supabaseServer
    .from('StudentDocument')
    .select('id, title, fileName, fileUrl, createdAt, studentNote')
    .eq('studentId', studentId)

  if (titleError && isMissingStudentNoteColumn(titleError)) {
    const { data: basicDocuments, error: basicError } = await supabaseServer
      .from('StudentDocument')
      .select('id, title, fileName, fileUrl, createdAt')
      .eq('studentId', studentId)

    if (basicError) {
      console.error('Error loading student documents for checklist fallback:', basicError)
      return linkedDocuments
    }

    for (const document of basicDocuments || []) {
      const mapping = getChecklistSlugAndSlotForDocumentTitle(document.title)
      if (!mapping) continue
      await setLinkedDocument(
        { ...document, studentNote: null },
        mapping.slug,
        mapping.slotKey || undefined
      )
    }

    return linkedDocuments
  }

  if (titleError) {
    console.error('Error loading student documents for checklist fallback:', titleError)
    return linkedDocuments
  }

  for (const document of documentsByTitle || []) {
    const mapping = getChecklistSlugAndSlotForDocumentTitle(document.title)
    if (!mapping) continue
    await setLinkedDocument(document, mapping.slug, mapping.slotKey || undefined)
  }

  return linkedDocuments
}

export async function loadStudentOnboardingChecklist(
  studentId: string
): Promise<{ items: OnboardingChecklistItemView[] } | null> {
  const { data: student, error: studentError } = await supabaseServer
    .from('User')
    .select('id, name, role')
    .eq('id', studentId)
    .eq('role', 'STUDENT')
    .single()

  if (studentError || !student) {
    return null
  }

  const [{ data: checklistData, error: checklistError }, linkedDocumentsBySlug] =
    await Promise.all([
      supabaseServer
        .from('StudentOnboardingChecklistItem')
        .select('*')
        .eq('studentId', studentId),
      loadLinkedChecklistDocuments(studentId),
    ])

  if (checklistError) {
    console.error('Error loading onboarding checklist:', checklistError)
  }

  const expiresIn = 365 * 24 * 60 * 60
  const records = await Promise.all(
    ((checklistData || []) as OnboardingChecklistItemRecord[]).map(async (record) => {
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

  return {
    items: mergeChecklistWithRecords(records, linkedDocumentsBySlug),
  }
}
