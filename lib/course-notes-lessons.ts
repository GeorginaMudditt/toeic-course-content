/** Minimal row shape for lesson numbering (structured course notes). */
export type NotesRowWithDate = { date: string }

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

/**
 * Parse display dates from the notes table (e.g. from "Insert date":
 * "Friday 6 February 2026", or "Friday the 6th of March 2026").
 * Returns ms timestamp for sorting, or null if not recognised.
 */
export function parseLessonDateDisplay(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const t = Date.parse(s.slice(0, 10))
    return Number.isNaN(t) ? null : t
  }

  // "Friday 6 February 2026"
  let m = s.match(/^(\w+)\s+(\d{1,2})\s+(\w+)\s+(\d{4})\s*$/i)
  if (m) {
    const day = parseInt(m[2], 10)
    const monthName = m[3].toLowerCase()
    const year = parseInt(m[4], 10)
    const month = MONTHS[monthName]
    if (month !== undefined) {
      const d = new Date(year, month, day)
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d.getTime()
      }
    }
  }

  // "Friday the 6th of March 2026"
  m = s.match(
    /^(\w+)\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\s+of\s+(\w+)\s+(\d{4})\s*$/i
  )
  if (m) {
    const day = parseInt(m[2], 10)
    const monthName = m[3].toLowerCase()
    const year = parseInt(m[4], 10)
    const month = MONTHS[monthName]
    if (month !== undefined) {
      const d = new Date(year, month, day)
      if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d.getTime()
      }
    }
  }

  const fallback = Date.parse(s)
  return Number.isNaN(fallback) ? null : fallback
}

/** Per-row lesson number (1-based) for rows with a date; null for rows without a date. */
export function assignLessonNumbers(rows: NotesRowWithDate[]): (number | null)[] {
  const out: (number | null)[] = rows.map(() => null)

  const dated = rows
    .map((row, i) => ({
      i,
      dateStr: row.date.trim(),
      t: parseLessonDateDisplay(row.date),
    }))
    .filter((x) => x.dateStr.length > 0)

  dated.sort((a, b) => {
    const at = a.t ?? Number.MAX_SAFE_INTEGER
    const bt = b.t ?? Number.MAX_SAFE_INTEGER
    if (at !== bt) return at - bt
    return a.i - b.i
  })

  dated.forEach((x, n) => {
    out[x.i] = n + 1
  })

  return out
}

export const LESSONS_REMAINING_WARNING_THRESHOLD = 2

export function computePackageProgress(rows: NotesRowWithDate[], courseDurationHours: number) {
  const lessonNums = assignLessonNumbers(rows)
  const lessonsLogged = lessonNums.filter((n) => n !== null).length
  const lessonsRemaining =
    courseDurationHours > 0 ? Math.max(0, courseDurationHours - lessonsLogged) : null
  const showLowLessonsWarning =
    courseDurationHours > 0 &&
    lessonsRemaining !== null &&
    lessonsRemaining <= LESSONS_REMAINING_WARNING_THRESHOLD &&
    lessonsRemaining > 0
  const loggedOverPackage =
    courseDurationHours > 0 && lessonsLogged > courseDurationHours

  return {
    lessonNums,
    lessonsLogged,
    lessonsRemaining,
    showLowLessonsWarning,
    loggedOverPackage,
  }
}

/** Count lesson rows that have a logged date (independent of package size). */
export function countLoggedLessonsFromNotesContent(content: string): number {
  try {
    const parsed = JSON.parse(content) as { version?: number; rows?: NotesRowWithDate[] }
    if (parsed?.version === 1 && Array.isArray(parsed.rows)) {
      const { lessonsLogged } = computePackageProgress(parsed.rows, 1)
      return lessonsLogged
    }
  } catch {
    // legacy HTML or empty
  }
  return 0
}
