export const WRITING_SUBMISSION_STATUSES = ['SUBMITTED', 'MARKED'] as const
export type WritingSubmissionStatus = (typeof WRITING_SUBMISSION_STATUSES)[number]

export const WRITING_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const

export const WRITING_MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB

export type WritingSubmissionRow = {
  id: string
  studentId: string
  title: string
  originalText: string
  fileUrl: string | null
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
  status: string
  markedHtml: string | null
  teacherComments: string | null
  score: number | null
  submittedAt: string
  markedAt: string | null
  markedById: string | null
  uploadedById: string | null
  createdAt: string
  updatedAt: string
}

export function isWritingSubmissionStatus(value: unknown): value is WritingSubmissionStatus {
  return typeof value === 'string' && WRITING_SUBMISSION_STATUSES.includes(value as WritingSubmissionStatus)
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Convert plain original text into editable HTML paragraphs for the mark editor. */
export function plainTextToEditableHtml(text: string): string {
  const trimmed = text.replace(/\r\n/g, '\n')
  if (!trimmed.trim()) {
    return '<p><br></p>'
  }
  return trimmed
    .split('\n')
    .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('')
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'MARKED':
      return 'Marked'
    case 'SUBMITTED':
      return 'Awaiting marking'
    default:
      return status
  }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
