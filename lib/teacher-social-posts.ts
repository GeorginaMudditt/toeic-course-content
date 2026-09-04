export type TeacherSocialPostStatus = 'OPEN' | 'DONE'

export type TeacherSocialPost = {
  id: string
  teacherId: string
  title: string
  plannedDate: string
  status: TeacherSocialPostStatus
  sortOrder: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function isTeacherSocialPostStatus(value: unknown): value is TeacherSocialPostStatus {
  return value === 'OPEN' || value === 'DONE'
}

/**
 * Extract the calendar date (YYYY-MM-DD) from a stored value without timezone shifts.
 * Supabase may return timestamps without a Z, which JS would otherwise treat as local time.
 */
export function extractCalendarDate(value: string): string {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

/**
 * Normalize an HTML date input (YYYY-MM-DD) for storage.
 * Noon UTC avoids midnight edge cases if a client ever formats via local timezone.
 */
export function plannedDateToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return `${value}T12:00:00.000Z`
}

/** Format stored plannedDate for an HTML date input. */
export function plannedDateToInputValue(value: string): string {
  return extractCalendarDate(value)
}

export function formatPlannedDate(value: string): string {
  const ymd = extractCalendarDate(value)
  if (!ymd) return '—'

  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
