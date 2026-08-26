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

function tryParseNotesObject(
  notes: string | null | undefined
): Record<string, unknown> | null {
  if (notes == null || !String(notes).trim()) return null
  try {
    const parsed = JSON.parse(String(notes)) as unknown
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Prefer keeping a previously saved non-empty string when an incoming save
 * would replace it with "". Protects long-form writing from flush/beacon races
 * (e.g. textareas unmounted on leave while AI-feedback keys keep the payload "meaningful").
 */
function shouldPreserveExistingString(
  key: string,
  existingValue: unknown,
  incomingValue: unknown
): boolean {
  if (typeof incomingValue !== 'string' || incomingValue.trim().length > 0) return false
  if (typeof existingValue !== 'string' || existingValue.trim().length === 0) return false

  const isWritingKey =
    key.includes('writing-') ||
    key.includes('writing_') ||
    key.endsWith('-ai-feedback') ||
    key === 'writing' ||
    key === 'essay'

  // Short grammar gap answers may be intentionally cleared; only protect longer text / writing keys.
  return isWritingKey || existingValue.trim().length > 40
}

/**
 * Never replace stored answers with an empty payload (e.g. MarkAsViewed race).
 * Also merge field-by-field so empty strings cannot wipe longer saved writing when
 * other keys (AI feedback, etc.) make the incoming payload look meaningful.
 */
export function resolveNotesForSave(
  existingNotes: string | null | undefined,
  incomingNotes: string | null | undefined
): string {
  const incoming = incomingNotes ?? ''
  if (!hasMeaningfulNotes(incoming) && hasMeaningfulNotes(existingNotes)) {
    return existingNotes!
  }

  const existingObj = tryParseNotesObject(existingNotes)
  const incomingObj = tryParseNotesObject(incoming)
  if (!existingObj || !incomingObj) {
    return incoming
  }

  const merged: Record<string, unknown> = { ...existingObj }
  let changed = false

  for (const [key, value] of Object.entries(incomingObj)) {
    if (shouldPreserveExistingString(key, existingObj[key], value)) {
      merged[key] = existingObj[key]
      changed = true
      continue
    }
    if (merged[key] !== value) {
      merged[key] = value
      changed = true
    }
  }

  if (!changed && Object.keys(incomingObj).length === Object.keys(existingObj).length) {
    return incoming
  }

  return JSON.stringify(merged, null, 2)
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
