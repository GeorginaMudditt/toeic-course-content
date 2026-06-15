import {
  getChecklistItemDefinition,
  getLinkedDocumentMapKey,
  isDocumentLinkedChecklistType,
  isDualDocumentOrNaType,
  STUDENT_ONBOARDING_CHECKLIST_ITEMS,
} from '@/lib/student-onboarding-checklist'

export function isMissingChecklistItemSlugColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return message.includes('checklistitemslug') || (message.includes('column') && message.includes('does not exist'))
}

export function isMissingWorkflowStateColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return message.includes('workflowstate') || (message.includes('column') && message.includes('does not exist'))
}

export function getDocumentTitleForChecklistSlug(
  checklistItemSlug: string,
  checklistDocumentKey?: string
): string | undefined {
  const item = getChecklistItemDefinition(checklistItemSlug)
  if (!item) return undefined

  if (isDualDocumentOrNaType(item.type)) {
    const slot = item.documentSlots?.find((entry) => entry.key === checklistDocumentKey)
    return slot?.documentTitle
  }

  return item && isDocumentLinkedChecklistType(item.type) ? item.documentTitle : undefined
}

export function isMissingStudentNoteColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return message.includes('studentnote') || (message.includes('column') && message.includes('does not exist'))
}

export function getChecklistSlugAndSlotForDocumentTitle(
  title: string
): { slug: string; slotKey: string } | undefined {
  for (const entry of STUDENT_ONBOARDING_CHECKLIST_ITEMS) {
    if (isDualDocumentOrNaType(entry.type)) {
      const slot = entry.documentSlots?.find((documentSlot) => documentSlot.documentTitle === title)
      if (slot) {
        return { slug: entry.slug, slotKey: slot.key }
      }
      continue
    }

    if (isDocumentLinkedChecklistType(entry.type) && entry.documentTitle === title) {
      return { slug: entry.slug, slotKey: '' }
    }
  }

  return undefined
}

export function getChecklistSlugForDocumentTitle(title: string): string | undefined {
  return getChecklistSlugAndSlotForDocumentTitle(title)?.slug
}
