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
  
  return `${cleanedName} (${duration} hours)`
}

