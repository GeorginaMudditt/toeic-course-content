export const STUDENT_LIFECYCLE_STATUS_VALUES = [
  'ACTIVE_STUDENT',
  'PAST_STUDENT',
  'TESTING',
  'EDITING',
] as const

export type StudentLifecycleStatus = (typeof STUDENT_LIFECYCLE_STATUS_VALUES)[number]

export const STUDENT_LIFECYCLE_LABELS: Record<StudentLifecycleStatus, string> = {
  ACTIVE_STUDENT: 'Active student',
  PAST_STUDENT: 'Past student',
  TESTING: 'Testing',
  EDITING: 'Editing',
}

/** Tailwind classes: row wash, left stripe (first cell), and select styling */
export const STUDENT_LIFECYCLE_VISUAL: Record<
  StudentLifecycleStatus,
  { rowClass: string; leftStripeClass: string; selectClass: string }
> = {
  ACTIVE_STUDENT: {
    rowClass: 'bg-emerald-50/90 hover:bg-emerald-50',
    leftStripeClass: 'border-l-4 border-l-emerald-600',
    selectClass:
      'border-emerald-400 bg-emerald-100 text-emerald-950 focus:ring-emerald-500/40 focus:border-emerald-500',
  },
  PAST_STUDENT: {
    rowClass: 'bg-slate-100/90 hover:bg-slate-100',
    leftStripeClass: 'border-l-4 border-l-slate-500',
    selectClass:
      'border-slate-400 bg-slate-200 text-slate-900 focus:ring-slate-500/40 focus:border-slate-500',
  },
  TESTING: {
    rowClass: 'bg-amber-50/90 hover:bg-amber-50',
    leftStripeClass: 'border-l-4 border-l-amber-500',
    selectClass:
      'border-amber-400 bg-amber-100 text-amber-950 focus:ring-amber-500/40 focus:border-amber-500',
  },
  EDITING: {
    rowClass: 'bg-violet-50/90 hover:bg-violet-50',
    leftStripeClass: 'border-l-4 border-l-violet-600',
    selectClass:
      'border-violet-400 bg-violet-100 text-violet-950 focus:ring-violet-500/40 focus:border-violet-500',
  },
}

export function isValidStudentLifecycleStatus(value: string): value is StudentLifecycleStatus {
  return (STUDENT_LIFECYCLE_STATUS_VALUES as readonly string[]).includes(value)
}

export function normalizeStudentLifecycleStatus(
  value: string | null | undefined,
  fallback: StudentLifecycleStatus = 'ACTIVE_STUDENT'
): StudentLifecycleStatus {
  if (value && isValidStudentLifecycleStatus(value)) {
    return value
  }
  return fallback
}
