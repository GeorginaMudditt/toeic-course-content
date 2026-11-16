import { jsPDF } from 'jspdf'
import { formatCourseName } from '@/lib/date-utils'
import {
  parseLessonDateDisplay,
  type LessonDurationHours,
} from '@/lib/course-notes-lessons'

const PAGE_WIDTH = 210
const MARGIN_X = 18
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const CONTENT_BOTTOM = 274

const BLUE: [number, number, number] = [56, 67, 143]
const RED: [number, number, number] = [186, 54, 39]
const INK: [number, number, number] = [17, 24, 39]
const MUTED: [number, number, number] = [75, 85, 99]
const LINE: [number, number, number] = [209, 213, 219]

const COLUMNS = [
  { title: 'Séance', width: 26 },
  { title: 'Date', width: 64 },
  { title: 'Durée', width: 30 },
  { title: 'Présence', width: 54 },
] as const

const WEEKDAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

export type AttendancePdfStatus = '' | 'YES_ONLINE' | 'YES_IN_PERSON' | 'NO_NOT_INFORMED'

export type AttendanceRecordRow = {
  lessonNum: number
  date: string
  durationHours: LessonDurationHours
  attendance: AttendancePdfStatus
}

export type AttendanceRecordPdfInput = {
  studentName: string
  studentEmail: string
  /** English course title, with the hour count already written in French. */
  courseName: string
  hoursBooked: number
  hoursAttended: number
  rows: AttendanceRecordRow[]
}

/** Keep the course title in English and write the package length in French. */
export function formatCourseNameForAttendancePdf(name: string, duration: number): string {
  const formatted = formatCourseName(name, duration)
  return formatted.replace(/\((\d+(?:[.,]\d+)?)\s+hours\)$/i, (_, raw: string) => {
    const hours = Number(String(raw).replace(',', '.'))
    const shown = Number.isInteger(hours) ? String(hours) : String(hours).replace('.', ',')
    const unit = hours > 0 && hours < 2 ? 'heure' : 'heures'
    return `(${shown} ${unit})`
  })
}

function frenchNumber(hours: number): string {
  const halves = Math.round(hours * 2) / 2
  if (!Number.isFinite(halves)) return '0'
  return Number.isInteger(halves) ? String(halves) : halves.toFixed(1).replace('.', ',')
}

function isSingularHour(hours: number): boolean {
  const halves = Math.round(hours * 2) / 2
  return halves > 0 && halves < 2
}

function frenchHoursBooked(hours: number): string {
  return `${frenchNumber(hours)} ${isSingularHour(hours) ? 'heure réservée' : 'heures réservées'}`
}

function frenchHoursAttended(hours: number): string {
  return `${frenchNumber(hours)} ${isSingularHour(hours) ? 'heure suivie' : 'heures suivies'}`
}

function frenchLength(hours: LessonDurationHours): string {
  if (hours === 0.5) return '30 minutes'
  if (hours === 2) return '2 heures'
  return '1 heure'
}

function frenchAttendance(attendance: AttendancePdfStatus): string {
  switch (attendance) {
    case 'YES_ONLINE':
      return 'Cours en ligne'
    case 'YES_IN_PERSON':
      return 'Cours en présentiel'
    case 'NO_NOT_INFORMED':
      return 'Absence non signalée'
    default:
      return 'Non renseigné'
  }
}

function frenchLessonDate(raw: string): string {
  const timestamp = parseLessonDateDisplay(raw)
  if (timestamp == null) return raw.trim() || '-'
  const date = new Date(timestamp)
  return `${WEEKDAYS_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`
}

function frenchGeneratedOn(date: Date): string {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`
}

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setDraw(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
}

function setInk(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawFooter(doc: jsPDF, page: number, pageCount: number) {
  setDraw(doc, LINE)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, 280, PAGE_WIDTH - MARGIN_X, 280)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setInk(doc, RED)
  doc.text('www.brizzle-english.com', MARGIN_X, 286)
  setInk(doc, MUTED)
  doc.text(`Page ${page} sur ${pageCount}`, PAGE_WIDTH - MARGIN_X, 286, { align: 'right' })
}

function drawLetterhead(doc: jsPDF, logoDataUri: string): number {
  const logoSize = 24
  const logoFormat = logoDataUri.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
  doc.addImage(logoDataUri, logoFormat, (PAGE_WIDTH - logoSize) / 2, 14, logoSize, logoSize)

  let y = 44
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setInk(doc, BLUE)
  doc.text('Brizzle English School', PAGE_WIDTH / 2, y, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setInk(doc, MUTED)
  const identity = [
    'RDC, 9 rue Maréchal Foch, 83570 Carcès',
    'SIRET 10261295900019',
    'NDA : organisme de formation enregistré sous le numéro 93 83 08842 83.',
  ]
  for (const line of identity) {
    y += 5
    const wrapped = doc.splitTextToSize(line, CONTENT_WIDTH)
    doc.text(wrapped, PAGE_WIDTH / 2, y, { align: 'center' })
    y += (wrapped.length - 1) * 4
  }

  y += 4
  setDraw(doc, BLUE)
  doc.setLineWidth(0.6)
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y)
  return y + 8
}

function drawField(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setInk(doc, INK)
  doc.text(label, MARGIN_X, y)

  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(value || '-', CONTENT_WIDTH - 28)
  doc.text(lines, MARGIN_X + 28, y)
  return y + Math.max(lines.length, 1) * 5 + 1.2
}

function cellLines(doc: jsPDF, value: string, width: number): string[] {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(value || '-', width - 6)
  return lines.length > 0 ? lines : ['-']
}

function rowHeight(lineCounts: number[]): number {
  const lines = Math.max(...lineCounts, 1)
  return Math.max(8, lines * 4.5 + 3.4)
}

function drawTableHeader(doc: jsPDF, y: number): number {
  const height = 8
  setFill(doc, BLUE)
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setInk(doc, [255, 255, 255])
  let x = MARGIN_X
  for (const column of COLUMNS) {
    doc.text(column.title, x + 3, y + 5.3)
    x += column.width
  }
  return y + height
}

function drawTableRow(
  doc: jsPDF,
  lines: string[][],
  y: number,
  height: number
) {
  setDraw(doc, LINE)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, height, 'S')
  let x = MARGIN_X
  for (let i = 0; i < COLUMNS.length - 1; i++) {
    x += COLUMNS[i].width
    doc.line(x, y, x, y + height)
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setInk(doc, INK)
  lines.forEach((text, index) => {
    const cellX =
      MARGIN_X + COLUMNS.slice(0, index).reduce((sum, column) => sum + column.width, 0) + 3
    doc.text(text, cellX, y + 5.3)
  })
}

function drawContinuationHeader(doc: jsPDF, studentName: string): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setInk(doc, BLUE)
  doc.text('Relevé de présence', MARGIN_X, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setInk(doc, MUTED)
  const nameLines = doc.splitTextToSize(studentName, CONTENT_WIDTH)
  doc.text(nameLines, MARGIN_X, 21)
  const y = 21 + nameLines.length * 4 + 2
  setDraw(doc, LINE)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y)
  return y + 6
}

export function buildAttendanceRecordPdf(
  input: AttendanceRecordPdfInput,
  logoDataUri: string
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = drawLetterhead(doc, logoDataUri)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setInk(doc, INK)
  doc.text('Relevé de présence', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setInk(doc, MUTED)
  doc.text(`Généré le ${frenchGeneratedOn(new Date())}`, PAGE_WIDTH / 2, y, { align: 'center' })
  y += 10

  y = drawField(doc, 'Stagiaire', input.studentName, y)
  y = drawField(doc, 'Courriel', input.studentEmail, y)
  y = drawField(doc, 'Formation', input.courseName, y)
  y += 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setInk(doc, INK)
  doc.text(
    `${frenchHoursBooked(input.hoursBooked)} · ${frenchHoursAttended(input.hoursAttended)}`,
    MARGIN_X,
    y
  )
  y += 6

  const tableRows =
    input.rows.length > 0
      ? input.rows.map((row) => ({
          lessonLabel: `Séance ${row.lessonNum}`,
          date: frenchLessonDate(row.date),
          length: frenchLength(row.durationHours),
          attendance: frenchAttendance(row.attendance),
        }))
      : [
          {
            lessonLabel: '-',
            date: 'Aucune séance enregistrée.',
            length: '-',
            attendance: '-',
          },
        ]

  y = drawTableHeader(doc, y)

  for (const row of tableRows) {
    const lines = [
      cellLines(doc, row.lessonLabel, COLUMNS[0].width),
      cellLines(doc, row.date, COLUMNS[1].width),
      cellLines(doc, row.length, COLUMNS[2].width),
      cellLines(doc, row.attendance, COLUMNS[3].width),
    ]
    const height = rowHeight(lines.map((entry) => entry.length))
    if (y + height > CONTENT_BOTTOM) {
      doc.addPage()
      y = drawContinuationHeader(doc, input.studentName)
      y = drawTableHeader(doc, y)
    }
    drawTableRow(doc, lines, y, height)
    y += height
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    drawFooter(doc, page, pageCount)
  }

  return doc
}

export function attendanceRecordFileName(studentName: string): string {
  const slug =
    studentName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'student'
  return `Releve-de-presence-${slug}.pdf`
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the Brizzle logo'))
    reader.readAsDataURL(blob)
  })
}

/** Shrink the logo before jsPDF embeds it, so the file stays a normal document size. */
async function loadLogoDataUri(): Promise<string> {
  const response = await fetch('/brizzle-logo.png')
  if (!response.ok) {
    throw new Error('Could not load the Brizzle logo')
  }
  const blob = await response.blob()
  if (typeof createImageBitmap !== 'function') {
    return blobToDataUri(blob)
  }

  const bitmap = await createImageBitmap(blob)
  const size = 360
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close?.()
    return blobToDataUri(blob)
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)
  context.drawImage(bitmap, 0, 0, size, size)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', 0.92)
}

export async function downloadAttendanceRecordPdf(input: AttendanceRecordPdfInput): Promise<void> {
  const logoDataUri = await loadLogoDataUri()
  const doc = buildAttendanceRecordPdf(input, logoDataUri)
  doc.save(attendanceRecordFileName(input.studentName))
}
