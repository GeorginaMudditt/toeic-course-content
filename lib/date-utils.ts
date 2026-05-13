/**
 * Normalise a DB / JSON timestamp to a UTC ISO string so `new Date()` in the browser
 * always represents the same instant (avoids ambiguous space-separated Postgres strings).
 */
export function toCanonicalIsoTimestamp(value: unknown): string | null {
  if (value == null) return null
  let s = String(value).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) {
    s = s.replace(' ', 'T')
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

/**
 * Format date to UK format (DD/MM/YYYY)
 */
export function formatUKDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format course name with duration: "Course Name (X hours)"
 * Removes any existing duration patterns before adding the standardized format
 */
export function formatCourseName(name: string, duration: number): string {
  // Remove patterns like "- 30 Hours", "- 30 hours", "- 30Hours", " - 30 Hours", etc.
  // Also remove patterns like "(30 hours)", "(30 Hours)", etc. if they exist
  let cleanedName = name
    .replace(/\s*-\s*\d+\s*Hours?/gi, '') // Remove "- X Hours" or "- X hours"
    .replace(/\s*\(\s*\d+\s*hours?\s*\)/gi, '') // Remove "(X hours)" or "(X Hours)"
    .trim()
  
  if (!duration || duration <= 0) {
    return cleanedName
  }

  return `${cleanedName} (${duration} hours)`
}

