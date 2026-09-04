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

/** Normalize an HTML date input (YYYY-MM-DD) to an ISO timestamp at UTC midnight. */
export function plannedDateToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return `${value}T00:00:00.000Z`
}

/** Format stored plannedDate for an HTML date input. */
export function plannedDateToInputValue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatPlannedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
