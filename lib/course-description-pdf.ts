export const COURSE_DESCRIPTIONS_BUCKET = 'adult-course-descriptions'

export const COURSE_DESCRIPTIONS_BASE_URL =
  'https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/public/adult-course-descriptions'

export function buildCourseDescriptionPdfUrl(pdfFileName: string): string {
  const segments = pdfFileName.split('/').map((segment) => encodeURIComponent(segment))
  return `${COURSE_DESCRIPTIONS_BASE_URL}/${segments.join('/')}`
}

/** Accept a storage filename or a full Supabase public URL. */
export function parseCourseDescriptionPdfFileName(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('PDF filename or URL is required')
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const url = new URL(trimmed)
    const marker = `/storage/v1/object/public/${COURSE_DESCRIPTIONS_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) {
      throw new Error(`URL must point to the ${COURSE_DESCRIPTIONS_BUCKET} storage bucket`)
    }
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  }

  return trimmed.replace(/^\/+/, '')
}
