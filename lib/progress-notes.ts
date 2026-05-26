/** Whether saved notes JSON contains any student work (answers, writing, etc.). */
export function hasMeaningfulNotes(notes: string | null | undefined): boolean {
  if (notes == null || !String(notes).trim()) return false
  const trimmed = String(notes).trim()
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return trimmed.length > 2
    }
    return Object.entries(parsed as Record<string, unknown>).some(([, value]) => {
      if (value == null) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some(
          (v) => typeof v === 'string' && v.trim().length > 0
        )
      }
      return true
    })
  } catch {
    return trimmed.length > 0
  }
}

/** Never replace stored answers with an empty payload (e.g. MarkAsViewed race). */
export function resolveNotesForSave(
  existingNotes: string | null | undefined,
  incomingNotes: string | null | undefined
): string {
  const incoming = incomingNotes ?? ''
  if (!hasMeaningfulNotes(incoming) && hasMeaningfulNotes(existingNotes)) {
    return existingNotes!
  }
  return incoming
}

const STATUS_ORDER: Record<string, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
}

/** Do not downgrade progress status (e.g. NOT_STARTED after student has started). */
export function resolveStatusForSave(
  existingStatus: string | null | undefined,
  incomingStatus: string
): string {
  const existingRank = STATUS_ORDER[existingStatus ?? ''] ?? -1
  const incomingRank = STATUS_ORDER[incomingStatus] ?? -1
  if (existingRank > incomingRank) return existingStatus!
  return incomingStatus
}
