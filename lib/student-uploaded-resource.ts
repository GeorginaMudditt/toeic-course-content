export const STUDENT_PDF_CONTENT_TYPE = 'student-pdf'

export const STUDENT_UPLOAD_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export const STUDENT_UPLOAD_SKILLS: { value: string; label: string }[] = [
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'READING', label: 'Reading' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'TESTS', label: 'Tests' },
  { value: 'REFERENCE', label: 'Reference' },
  { value: 'TRAVEL_ENGLISH', label: 'Travel English' },
  { value: 'BUSINESS_ENGLISH', label: 'Business English' },
  { value: 'EVERYDAY_ENGLISH', label: 'Everyday English' },
]

type StudentPdfContent = {
  type: typeof STUDENT_PDF_CONTENT_TYPE
  pdf: string
  storagePath: string
  fileName?: string
}

function readStudentPdfContent(content: string | null | undefined): StudentPdfContent | null {
  if (!content || !content.trim().startsWith('{')) return null
  try {
    const data = JSON.parse(content) as Partial<StudentPdfContent>
    if (data?.type !== STUDENT_PDF_CONTENT_TYPE) return null
    if (typeof data.pdf !== 'string' || typeof data.storagePath !== 'string') return null
    return data as StudentPdfContent
  } catch {
    return null
  }
}

export function isStudentUploadedResource(content: string | null | undefined): boolean {
  return readStudentPdfContent(content) !== null
}

export function studentUploadedPdfUrl(content: string | null | undefined): string | null {
  return readStudentPdfContent(content)?.pdf ?? null
}

export function studentUploadedStoragePath(content: string | null | undefined): string | null {
  return readStudentPdfContent(content)?.storagePath ?? null
}

export function buildStudentPdfContent(input: {
  pdfUrl: string
  storagePath: string
  fileName: string
}): string {
  const payload: StudentPdfContent = {
    type: STUDENT_PDF_CONTENT_TYPE,
    pdf: input.pdfUrl,
    storagePath: input.storagePath,
    fileName: input.fileName,
  }
  return JSON.stringify(payload)
}
