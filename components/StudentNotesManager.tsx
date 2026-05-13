'use client'

import { useState, useEffect, useLayoutEffect, useRef, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { formatCourseName } from '@/lib/date-utils'
import { ClientLocalDateTime } from '@/components/ClientLocalDateTime'
import {
  computePackageProgress,
  normalizeLessonDurationHours,
  parseCourseDurationHours,
  parseLessonDateDisplay,
  type LessonDurationHours,
} from '@/lib/course-notes-lessons'

interface Enrollment {
  id: string
  course: {
    id: string
    name: string
    duration: number
  } | null
}

interface Props {
  student: {
    id: string
    name: string
  }
  enrollments: Enrollment[]
}

type AttendanceOption = '' | 'YES_ONLINE' | 'YES_IN_PERSON' | 'NO_NOT_INFORMED'

interface LessonRow {
  date: string
  /** Billable length for this dated session (default 1). Used for package hours and midpoint email. */
  durationHours: LessonDurationHours
  attendance: AttendanceOption
  lessonTopic: string
  corrections: string
  notes: string
}

interface NotesDataV1 {
  version: 1
  rows: LessonRow[]
}

/** Server-computed; teacher GET only — matches midpoint email logic */
interface CourseMidpointHint {
  hoursLogged: number
  courseDurationHours: number
  threshold: number
  meetsThreshold: boolean
  midpointEmailSent: boolean
  midpointNotificationSentAt: string | null
}

const createEmptyRow = (): LessonRow => ({
  date: '',
  durationHours: 1,
  attendance: '',
  lessonTopic: '',
  corrections: '',
  notes: '',
})

const hasContent = (row: LessonRow) =>
  !!(row.date || row.attendance || row.lessonTopic || row.corrections || row.notes)

/** True if rich-text HTML has visible text (not empty tags / br only). */
function htmlHasVisibleText(html: string): boolean {
  if (!html || typeof html !== 'string') return false
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u200b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 0
}

/** Alternating pale bands so each dated lesson’s header + details rows read as one block. */
function lessonStripRowClass(lessonNum: number | null): string {
  if (lessonNum == null) {
    return 'bg-slate-50'
  }
  if (lessonNum % 2 === 1) {
    return 'bg-amber-50/95'
  }
  return 'bg-sky-50/95'
}

/** Inputs / selects: tint matches the lesson strip so fields don’t read as “cold” white on amber rows. */
function lessonStripFieldClass(lessonNum: number | null): string {
  const base = 'rounded border text-sm text-gray-900 focus:outline-none focus:ring-1'
  if (lessonNum == null) {
    return `${base} border-gray-300 bg-white focus:ring-[#38438f]`
  }
  if (lessonNum % 2 === 1) {
    return `${base} border-amber-200/90 bg-amber-50/95 focus:ring-amber-400/70`
  }
  return `${base} border-sky-200/90 bg-sky-50/95 focus:ring-sky-400/70`
}

/** Rich-text editors: slightly stronger fill than the row so typing area matches the strip. */
function lessonStripEditorClass(lessonNum: number | null): string {
  const base =
    'w-full rounded border px-3 py-2 text-sm min-h-[140px] whitespace-pre-wrap text-gray-900 focus:outline-none focus:ring-1'
  if (lessonNum == null) {
    return `${base} border-gray-300 bg-white focus:ring-[#38438f]`
  }
  if (lessonNum % 2 === 1) {
    return `${base} border-amber-200/90 bg-amber-100/90 focus:ring-amber-400/70`
  }
  return `${base} border-sky-200/90 bg-sky-100/90 focus:ring-sky-400/70`
}

function lessonStripDetailsShellClass(lessonNum: number | null): string {
  if (lessonNum == null) return 'border-gray-200/90 bg-white/50'
  if (lessonNum % 2 === 1) return 'border-amber-200/90 bg-amber-50/50'
  return 'border-sky-200/90 bg-sky-50/50'
}

function lessonStripDetailsInnerClass(lessonNum: number | null): string {
  const base = 'space-y-4 border-t px-3 py-3'
  if (lessonNum == null) return `${base} border-gray-200 bg-white`
  if (lessonNum % 2 === 1) return `${base} border-amber-200/80 bg-amber-50/70`
  return `${base} border-sky-200/80 bg-sky-50/70`
}

function lessonStripSummaryHoverClass(lessonNum: number | null): string {
  if (lessonNum == null) return 'hover:bg-black/[0.04]'
  if (lessonNum % 2 === 1) return 'hover:bg-amber-100/55'
  return 'hover:bg-sky-100/55'
}

/** Matches globals.css `[data-lesson-strip]` overrides so inputs are not forced to app-wide light blue */
function lessonDataStripAttr(lessonNum: number | null): 'amber' | 'sky' | 'neutral' {
  if (lessonNum == null) return 'neutral'
  return lessonNum % 2 === 1 ? 'amber' : 'sky'
}

/** True when the date field is complete enough to sort/count as a lesson (not mid-typing). */
const rowHasParseableLessonDate = (row: LessonRow): boolean => {
  const d = row.date.trim()
  return d.length > 0 && parseLessonDateDisplay(d) !== null
}

/** Normalize a row loaded from JSON (supports notes saved before durationHours existed). */
function lessonRowFromStored(raw: unknown): LessonRow {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const att = o.attendance
  const attendance: AttendanceOption =
    att === 'YES_ONLINE' || att === 'YES_IN_PERSON' || att === 'NO_NOT_INFORMED' ? att : ''
  return {
    date: typeof o.date === 'string' ? o.date : '',
    durationHours: normalizeLessonDurationHours(o.durationHours),
    attendance,
    lessonTopic: typeof o.lessonTopic === 'string' ? o.lessonTopic : '',
    corrections: typeof o.corrections === 'string' ? o.corrections : '',
    notes: typeof o.notes === 'string' ? o.notes : '',
  }
}

const ensureLeadingEmptyRow = (rows: LessonRow[]): LessonRow[] => {
  if (!rows || rows.length === 0) {
    return [createEmptyRow()]
  }

  const anyContent = rows.some(hasContent)
  if (!anyContent) {
    return [createEmptyRow()]
  }

  const [first, ...rest] = rows
  const firstHasContent = hasContent(first)

  let normalizedRest = rest.filter((row) => hasContent(row))

  if (firstHasContent) {
    // Only insert a new scratch row once the date is fully parseable. If we did this on any
    // keystroke in the top row, the row would shift after the first character and manual dates
    // (including backdating) would be impossible.
    if (rowHasParseableLessonDate(first)) {
      return [createEmptyRow(), first, ...normalizedRest]
    }
    return [first, ...normalizedRest]
  }

  // First row is already empty - keep it, remove other empty rows
  return [first, ...normalizedRest]
}

export default function StudentNotesManager({ student, enrollments }: Props) {
  const router = useRouter()
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>(enrollments[0]?.id ?? '')
  const [content, setContent] = useState<string>('') // Raw content stored in DB (JSON string for new format)
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null)
  const [noteLoaded, setNoteLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [rows, setRows] = useState<LessonRow[]>([createEmptyRow()])
  const [teacherPrivateContent, setTeacherPrivateContent] = useState('')
  const [legacyContent, setLegacyContent] = useState<string | null>(null) // For any old free-form notes
  const [courseMidpointHint, setCourseMidpointHint] = useState<CourseMidpointHint | null>(null)
  const [coursePackageHoursInput, setCoursePackageHoursInput] = useState('10')
  const [savingCoursePackage, setSavingCoursePackage] = useState(false)
  const [coursePackageSaveError, setCoursePackageSaveError] = useState<string | null>(null)
  const [trackHoursModalOpen, setTrackHoursModalOpen] = useState(false)
  /**
   * Incremented after each successful load from the API so we can imperatively open <details>
   * for rows that already have corrections/notes. Native <details> is left uncontrolled to avoid
   * React toggle events where currentTarget is null (client crash).
   */
  const [detailsHydrateKey, setDetailsHydrateKey] = useState(0)
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const notesDetailsElementsRef = useRef<Map<number, HTMLDetailsElement>>(new Map())

  const registerNotesDetailsEl = (rowIndex: number, el: HTMLDetailsElement | null) => {
    if (el) notesDetailsElementsRef.current.set(rowIndex, el)
    else notesDetailsElementsRef.current.delete(rowIndex)
  }

  useLayoutEffect(() => {
    if (detailsHydrateKey === 0) return
    const snap = rowsRef.current
    notesDetailsElementsRef.current.forEach((el, i) => {
      const row = snap[i]
      if (!row) return
      if (htmlHasVisibleText(row.corrections) || htmlHasVisibleText(row.notes)) {
        el.open = true
      }
    })
  }, [detailsHydrateKey])

  // Track which editor has focus — we never overwrite that div's DOM so cursor and content stay correct
  const [focusedEditor, setFocusedEditor] = useState<{ rowIndex: number; field: 'corrections' | 'notes' } | null>(null)
  // Refs for each contentEditable; we set innerHTML only when that editor does NOT have focus
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Refs used by auto-save so we don't restart intervals on every keystroke.
  const contentRef = useRef<string>(content)
  const teacherPrivateContentRef = useRef<string>('')
  const noteUpdatedAtRef = useRef<string | null>(noteUpdatedAt)
  const lastSavedStudentContentRef = useRef<string>('')
  const lastSavedTeacherContentRef = useRef<string>('')
  const noteLoadedRef = useRef<boolean>(noteLoaded)
  const savingRef = useRef<boolean>(false)

  // Load note when enrollment changes
  useEffect(() => {
    if (selectedEnrollment) {
      setNoteLoaded(false)
      noteLoadedRef.current = false
      setCourseMidpointHint(null)
      setTrackHoursModalOpen(false)
      loadNote(selectedEnrollment)
    } else {
      setContent('')
      setNoteUpdatedAt(null)
      noteUpdatedAtRef.current = null
      setNoteLoaded(false)
      noteLoadedRef.current = false
      lastSavedStudentContentRef.current = ''
      lastSavedTeacherContentRef.current = ''
      teacherPrivateContentRef.current = ''
      setTeacherPrivateContent('')
      setRows([createEmptyRow()])
      setLegacyContent(null)
      setCourseMidpointHint(null)
      setDetailsHydrateKey(0)
      setTrackHoursModalOpen(false)
    }
  }, [selectedEnrollment])

  useEffect(() => {
    setCoursePackageSaveError(null)
    setCoursePackageHoursInput('10')
  }, [selectedEnrollment])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    noteUpdatedAtRef.current = noteUpdatedAt
  }, [noteUpdatedAt])

  useEffect(() => {
    if (!trackHoursModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTrackHoursModalOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [trackHoursModalOpen])

  const loadNote = async (enrollmentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/course-notes/${enrollmentId}`)
      const data = await response.json()

      if (data.courseMidpointHint && typeof data.courseMidpointHint === 'object') {
        setCourseMidpointHint(data.courseMidpointHint as CourseMidpointHint)
      } else {
        setCourseMidpointHint(null)
      }

      if (data.note && typeof data.note.content === 'string') {
        const raw = data.note.content as string
        setContent(raw)
        contentRef.current = raw
        lastSavedStudentContentRef.current = raw

        const teacherRaw =
          typeof data.note.teacherPrivateContent === 'string' ? data.note.teacherPrivateContent : ''
        setTeacherPrivateContent(teacherRaw)
        teacherPrivateContentRef.current = teacherRaw
        lastSavedTeacherContentRef.current = teacherRaw

        const updatedAt = typeof data.note.updatedAt === 'string' ? data.note.updatedAt : null
        setNoteUpdatedAt(updatedAt)
        noteUpdatedAtRef.current = updatedAt
        setNoteLoaded(true)
        noteLoadedRef.current = true

        // Try to parse as structured notes (JSON)
        try {
          const parsed = JSON.parse(raw) as NotesDataV1
          if (parsed && parsed.version === 1 && Array.isArray(parsed.rows)) {
            const normalized = ensureLeadingEmptyRow(parsed.rows.map(lessonRowFromStored))
            setRows(normalized)
            setDetailsHydrateKey((k) => k + 1)
            setLegacyContent(null)
            return
          }
        } catch {
          // Not JSON – treat as legacy content
        }

        // Legacy content: keep it for reference, start with a fresh table
        setLegacyContent(raw)
        setRows([createEmptyRow()])
        setDetailsHydrateKey((k) => k + 1)
      } else {
        // No existing note – start with a single empty row
        setContent('')
        contentRef.current = ''
        lastSavedStudentContentRef.current = ''
        setTeacherPrivateContent('')
        teacherPrivateContentRef.current = ''
        lastSavedTeacherContentRef.current = ''
        setNoteUpdatedAt(null)
        noteUpdatedAtRef.current = null
        setNoteLoaded(true)
        noteLoadedRef.current = true
        setLegacyContent(null)
        setRows([createEmptyRow()])
        setDetailsHydrateKey((k) => k + 1)
      }
    } catch (error) {
      console.error('Error loading note:', error)
      alert('Error loading note')
    } finally {
      setLoading(false)
    }
  }

  const saveNote = async () => {
    if (!selectedEnrollment) return
    if (!noteLoadedRef.current) return
    if (savingRef.current) return

    const contentToSave = contentRef.current || ''
    const teacherToSave = teacherPrivateContentRef.current ?? ''
    if (
      contentToSave === lastSavedStudentContentRef.current &&
      teacherToSave === lastSavedTeacherContentRef.current
    ) {
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      const expectedUpdatedAt = noteUpdatedAtRef.current

      const response = await fetch(`/api/course-notes/${selectedEnrollment}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentToSave,
          teacherPrivateContent: teacherToSave,
          expectedUpdatedAt,
        }),
      })

      if (response.status === 409) {
        // Another tab saved first; prevent overwriting and reload server truth.
        alert('This note was updated in another tab. Reloading the latest version.')
        await loadNote(selectedEnrollment)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      const data = await response.json()
      const nextUpdatedAt = data?.note?.updatedAt
      const nextUpdatedAtIso = typeof nextUpdatedAt === 'string' ? nextUpdatedAt : null

      setNoteUpdatedAt(nextUpdatedAtIso)
      noteUpdatedAtRef.current = nextUpdatedAtIso
      lastSavedStudentContentRef.current = contentToSave
      lastSavedTeacherContentRef.current = teacherToSave
      setLastSaved(new Date())

      try {
        const hintRes = await fetch(`/api/course-notes/${selectedEnrollment}`)
        if (hintRes.ok) {
          const hintJson = await hintRes.json()
          if (hintJson.courseMidpointHint && typeof hintJson.courseMidpointHint === 'object') {
            setCourseMidpointHint(hintJson.courseMidpointHint as CourseMidpointHint)
          }
        }
      } catch {
        /* non-fatal */
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Error saving note')
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedEnrollment || !noteLoaded) return

    const interval = setInterval(() => {
      void saveNote()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedEnrollment, noteLoaded])

  const syncActiveEditor = () => {
    const selection = document.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const anchorNode = selection.anchorNode
    if (!anchorNode) return

    const element =
      anchorNode.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as HTMLElement)
        : anchorNode.parentElement

    const editor = element?.closest('[data-notes-editor="true"]') as HTMLElement | null
    if (!editor) return

    const rowIndexAttr = editor.getAttribute('data-row-index')
    const field = editor.getAttribute('data-field') as 'corrections' | 'notes' | null
    if (rowIndexAttr == null || field == null) return

    const rowIndex = parseInt(rowIndexAttr, 10)
    if (Number.isNaN(rowIndex)) return

    const html = editor.innerHTML

    setRows((prev) => {
      if (!prev[rowIndex]) return prev
      const updated = [...prev]
      updated[rowIndex] = { ...updated[rowIndex], [field]: html }
      const normalized = ensureLeadingEmptyRow(updated)
      const payload: NotesDataV1 = { version: 1, rows: normalized }
      setContent(JSON.stringify(payload))
      return normalized
    })
  }

  const activeEnrollment = enrollments.find((e) => e.id === selectedEnrollment)
  const courseDurationHours = parseCourseDurationHours(activeEnrollment?.course?.duration)

  const { lessonNums, hoursLogged, hoursRemaining, showLowLessonsWarning, loggedOverPackage } =
    useMemo(
      () => computePackageProgress(rows, courseDurationHours),
      [rows, courseDurationHours]
    )

  const saveCoursePackageHours = async () => {
    const courseId = activeEnrollment?.course?.id
    if (!courseId) return

    const hours = parseCourseDurationHours(coursePackageHoursInput)
    if (hours <= 0) {
      setCoursePackageSaveError('Enter a whole number of hours (1 or more).')
      return
    }

    setSavingCoursePackage(true)
    setCoursePackageSaveError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: hours }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCoursePackageSaveError(
          typeof data.error === 'string' ? data.error : 'Could not update package hours.'
        )
        return
      }
      router.refresh()
      setTrackHoursModalOpen(false)
    } catch {
      setCoursePackageSaveError('Network error — try again.')
    } finally {
      setSavingCoursePackage(false)
    }
  }

  const insertDate = () => {
    const date = new Date()
    // Format: "Friday 6 February 2026" (no comma)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    const dateStr = `${dayName} ${day} ${monthName} ${year}`

    // Insert date into the first (most recent) editable row
    setRows((prev) => {
      const base = prev && prev.length > 0 ? [...prev] : [createEmptyRow()]
      base[0] = { ...base[0], date: dateStr }
      const normalized = ensureLeadingEmptyRow(base)
      const payload: NotesDataV1 = { version: 1, rows: normalized }
      setContent(JSON.stringify(payload))
      return normalized
    })
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-gray-500">This student is not enrolled in any courses yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <header className="mb-8 border-b border-gray-200 pb-8 text-center">
        {enrollments.length > 1 ? (
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38438f] sm:text-sm">
              Course
            </h2>
            <label htmlFor="course-select" className="mt-3 block text-base font-medium text-gray-700 sm:text-lg">
              Select enrollment
            </label>
            <select
              id="course-select"
              value={selectedEnrollment}
              onChange={(e) => setSelectedEnrollment(e.target.value)}
              className="mt-3 block w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-center text-lg font-bold text-gray-900 shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-2 focus:ring-[#38438f]/30 sm:text-xl"
            >
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.course
                    ? formatCourseName(enrollment.course.name, enrollment.course.duration)
                    : 'Unknown Course'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38438f] sm:text-sm">
              Course
            </h2>
            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              {enrollments[0].course
                ? formatCourseName(enrollments[0].course.name, enrollments[0].course.duration)
                : 'Unknown Course'}
            </h2>
          </div>
        )}
      </header>

      {selectedEnrollment && (
        <>
          {/* Private notes first — otherwise this sits below a long lesson table and is easy to miss */}
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Notes for teacher (private)</h2>
            <p className="text-sm text-gray-700 mt-1 mb-3">
              Not shown to students — only visible here in the teacher portal. Use for admin, billing,
              or internal reminders.
            </p>
            <textarea
              value={teacherPrivateContent}
              onChange={(e) => {
                const v = e.target.value
                setTeacherPrivateContent(v)
                teacherPrivateContentRef.current = v
              }}
              rows={6}
              className="w-full border border-amber-300/80 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#38438f] font-sans bg-white"
              placeholder="Internal notes (students cannot see this)…"
            />
            <p className="text-xs text-amber-900/80 mt-2">
              Saved with the same <span className="font-medium">Save</span> button below and by auto-save.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Notes for student</h2>
            <p className="text-sm text-gray-600 mt-1">
              Attendance, lesson topics, corrections, and notes below are visible to the student on{' '}
              <span className="font-medium">My Notes</span>.
            </p>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTrackHoursModalOpen(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
            >
              Track hours
            </button>
            {courseDurationHours > 0 && (
              <span className="text-sm text-gray-600">
                {hoursLogged} / {courseDurationHours} hours in this package
                {hoursRemaining !== null && hoursRemaining > 0 && (
                  <>
                    {' '}
                    · {hoursRemaining} hour{hoursRemaining === 1 ? '' : 's'} left
                  </>
                )}
              </span>
            )}
            {courseDurationHours === 0 && activeEnrollment?.course && (
              <span className="text-sm text-amber-900/90">
                Package is 0 h — open <span className="font-medium">Track hours</span> to set length
              </span>
            )}
          </div>

          {trackHoursModalOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="track-hours-modal-title"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Close dialog"
                onClick={() => setTrackHoursModalOpen(false)}
              />
              <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 id="track-hours-modal-title" className="text-lg font-semibold text-gray-900">
                    Track hours & midpoint email
                  </h2>
                  <button
                    type="button"
                    onClick={() => setTrackHoursModalOpen(false)}
                    className="shrink-0 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {courseDurationHours === 0 ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    <p className="font-semibold text-slate-800">Hours package & midpoint email</p>
                    <p className="mt-1 text-slate-700">
                      {activeEnrollment?.course ? (
                        <>
                          This course’s total package is <strong>0 hours</strong> in the database (often
                          because the student was enrolled under <strong>Other (custom course)</strong>, which
                          did not ask for a length). Hour tracking and the midpoint email stay off until you set
                          a positive package length.
                        </>
                      ) : (
                        <>
                          This enrollment is not linked to a course (or the course record is missing). Assign
                          a course with a positive hour package so hour tracking and midpoint emails can run.
                        </>
                      )}
                    </p>
                    {activeEnrollment?.course && (
                      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
                        <div>
                          <label
                            htmlFor="course-package-hours-modal"
                            className="block text-xs font-medium text-slate-700"
                          >
                            Total package (hours)
                          </label>
                          <input
                            id="course-package-hours-modal"
                            type="number"
                            min={1}
                            max={500}
                            step={1}
                            value={coursePackageHoursInput}
                            onChange={(e) => setCoursePackageHoursInput(e.target.value)}
                            className="mt-0.5 w-28 rounded border border-slate-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void saveCoursePackageHours()}
                          disabled={savingCoursePackage}
                          className="rounded-md bg-[#38438f] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d3569] disabled:opacity-50"
                        >
                          {savingCoursePackage ? 'Saving…' : 'Save package length'}
                        </button>
                      </div>
                    )}
                    {coursePackageSaveError && (
                      <p className="mt-2 text-sm text-red-700" role="alert">
                        {coursePackageSaveError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Hours tracking:</span>{' '}
                      {hoursLogged} of {courseDurationHours} hours used in this package
                      {hoursRemaining !== null && hoursRemaining > 0 && (
                        <>
                          {' '}
                          · {hoursRemaining} hour{hoursRemaining === 1 ? '' : 's'} remaining
                        </>
                      )}
                      {hoursRemaining === 0 && hoursLogged >= courseDurationHours && (
                        <> · all hours in this package are logged</>
                      )}
                    </p>
                    {showLowLessonsWarning && hoursRemaining !== null && (
                      <div
                        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                        role="status"
                      >
                        <strong>{student.name}</strong> only has{' '}
                        {hoursRemaining === 1
                          ? 'one hour'
                          : `${hoursRemaining} hours`}{' '}
                        left in this course. Consider contacting them about extending or booking another
                        package.
                      </div>
                    )}
                    {loggedOverPackage && (
                      <div
                        className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-950"
                        role="status"
                      >
                        More hours are logged than in this course package. Consider adding hours if{' '}
                        {student.name} is continuing.
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Set <span className="font-medium">Lesson length</span> to 1 or 2 hours per row (dated
                      lessons). When logged hours reach half the package ({Math.ceil(courseDurationHours / 2)}{' '}
                      of {courseDurationHours} hours for this course), saving notes sends a one-time email to{' '}
                      <span className="font-medium">hello@brizzle-english.com</span> for admin follow-up
                      (invoice, midpoint questionnaire, etc.).
                    </p>

                    <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                      <p className="font-semibold text-slate-800">Midpoint email (server check)</p>
                      {loading && !courseMidpointHint ? (
                        <p className="mt-1 text-slate-600">Loading server status…</p>
                      ) : courseMidpointHint ? (
                        <>
                          <p className="mt-1">
                            Saved notes total <strong>{courseMidpointHint.hoursLogged}</strong> billable hour
                            {courseMidpointHint.hoursLogged === 1 ? '' : 's'} · package{' '}
                            <strong>{courseMidpointHint.courseDurationHours}</strong> h · midpoint at{' '}
                            <strong>{courseMidpointHint.threshold}</strong> h
                          </p>
                          <p className="mt-1">
                            {courseMidpointHint.meetsThreshold ? (
                              <span className="text-green-800">
                                Threshold reached — saving should trigger the email (once) if Resend is
                                configured.
                              </span>
                            ) : (
                              <span className="text-amber-900">
                                Below midpoint — the server sees fewer hours than needed. Set each dated row to
                                1h or 2h and save again.
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-slate-700">
                            {courseMidpointHint.midpointEmailSent ? (
                              <>
                                <strong>Recorded as sent</strong>
                                {courseMidpointHint.midpointNotificationSentAt ? (
                                  <>
                                    {' ('}
                                    <ClientLocalDateTime
                                      iso={courseMidpointHint.midpointNotificationSentAt}
                                      preset="datetimeShort"
                                      className="inline"
                                    />
                                    {')'}
                                  </>
                                ) : null}
                                . No further automatic emails for this enrollment. To test again, clear{' '}
                                <code className="text-xs bg-white px-1 rounded">midpointNotificationSentAt</code>{' '}
                                on this course note in Supabase.
                              </>
                            ) : (
                              <>
                                <strong>Not recorded as sent yet.</strong> If you are at or above{' '}
                                {courseMidpointHint.threshold} h and still get no message, check production env{' '}
                                <code className="text-xs bg-white px-1 rounded">RESEND_API_KEY</code> and host
                                logs for <code className="text-xs bg-white px-1 rounded">[course-midpoint]</code>.
                              </>
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-slate-700">
                          <strong>Server status not loaded.</strong> Deploy the latest app and hard-refresh. If
                          this message persists, the course may have no duration in the database (this check only
                          runs when the package has a positive hour total).
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toolbar & actions */}
          <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={insertDate}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Insert today's date into the current lesson row"
            >
              📅 Insert Date
            </button>
            <div className="ml-4 flex flex-wrap gap-1 items-center">
              <span className="text-xs text-gray-600 px-2">Text:</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('bold')
                  syncActiveEditor()
                }}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('italic')
                  syncActiveEditor()
                }}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('underline')
                  syncActiveEditor()
                }}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs"
                title="Underline"
              >
                <u>U</u>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('foreColor', false, 'red')
                  syncActiveEditor()
                }}
                className="w-6 h-6 bg-red-500 border border-gray-300 rounded hover:opacity-80"
                title="Red text"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('foreColor', false, 'green')
                  syncActiveEditor()
                }}
                className="w-6 h-6 bg-green-500 border border-gray-300 rounded hover:opacity-80"
                title="Green text"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('foreColor', false, 'blue')
                  syncActiveEditor()
                }}
                className="w-6 h-6 bg-blue-500 border border-gray-300 rounded hover:opacity-80"
                title="Blue text"
              />
              <span className="text-xs text-gray-600 px-2">Highlight:</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('backColor', false, '#FFEB3B')
                  syncActiveEditor()
                }}
                className="w-6 h-6 bg-yellow-300 border border-gray-300 rounded hover:opacity-80"
                title="Yellow highlight"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('backColor', false, '#FF9800')
                  syncActiveEditor()
                }}
                className="w-6 h-6 bg-orange-400 border border-gray-300 rounded hover:opacity-80"
                title="Orange highlight"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('backColor', false, '#FF69B4')
                  syncActiveEditor()
                }}
                className="w-6 h-6 bg-pink-400 border border-gray-300 rounded hover:opacity-80"
                title="Pink highlight"
              />
              <span className="text-xs text-gray-600 px-2 ml-1 border-l border-gray-300 pl-3">Reset:</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  // Match contentEditable surface (#fff) so highlight disappears
                  document.execCommand('backColor', false, '#ffffff')
                  syncActiveEditor()
                }}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs"
                title="Remove background highlight from selection"
              >
                No highlight
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('foreColor', false, '#000000')
                  syncActiveEditor()
                }}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs"
                title="Reset text colour to black"
              >
                Text black
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  document.execCommand('removeFormat')
                  syncActiveEditor()
                }}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs"
                title="Remove bold, italic, underline, colours and highlights from selection"
              >
                Clear format
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                onClick={saveNote}
                disabled={saving}
                className="px-4 py-1 bg-[#38438f] text-white rounded hover:bg-[#2d3569] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Structured notes table */}
          <div className="border border-t-0 border-gray-300 rounded-b-lg p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-44">Date / length</th>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-48">Attendance</th>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 min-w-[14rem]">Lesson topic</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const rowHasContent = hasContent(row)
                  const lessonNum = lessonNums[index]
                  const stripClass = lessonStripRowClass(lessonNum)
                  const dataStrip = lessonDataStripAttr(lessonNum)

                  return (
                  <Fragment key={`notes-row-${index}`}>
                    <tr className={stripClass}>
                      {/* Date */}
                      <td className="px-3 py-2 border-b align-top">
                      <input
                        type="text"
                        data-lesson-strip={dataStrip}
                        value={row.date}
                        onChange={(e) => {
                          const value = e.target.value
                          setRows((prev) => {
                            const updated = [...prev]
                            updated[index] = { ...updated[index], date: value }
                            const normalized = ensureLeadingEmptyRow(updated)
                            const payload: NotesDataV1 = { version: 1, rows: normalized }
                            setContent(JSON.stringify(payload))
                            return normalized
                          })
                        }}
                        className={`w-full ${lessonStripFieldClass(lessonNum)}`}
                        placeholder="e.g. Friday 6 February 2026, 06/02/2026, or 2026-02-06"
                      />
                      <label className="block mt-2 text-xs font-medium text-gray-600">Lesson length</label>
                      <select
                        data-lesson-strip={dataStrip}
                        value={row.durationHours}
                        onChange={(e) => {
                          const durationHours = (e.target.value === '2' ? 2 : 1) as LessonDurationHours
                          setRows((prev) => {
                            const updated = [...prev]
                            updated[index] = { ...updated[index], durationHours }
                            const normalized = ensureLeadingEmptyRow(updated)
                            const payload: NotesDataV1 = { version: 1, rows: normalized }
                            setContent(JSON.stringify(payload))
                            return normalized
                          })
                        }}
                        className={`mt-0.5 w-full ${lessonStripFieldClass(lessonNum)}`}
                        aria-label={`Lesson length, row ${index + 1}`}
                      >
                        <option value={1}>1 hour</option>
                        <option value={2}>2 hours</option>
                      </select>
                      {lessonNum != null && (
                        <p className="mt-1 text-xs font-medium text-[#38438f]">(Lesson {lessonNum})</p>
                      )}
                      </td>

                      {/* Attendance */}
                      <td className="px-3 py-2 border-b align-top">
                      <select
                        data-lesson-strip={dataStrip}
                        value={row.attendance}
                        onChange={(e) => {
                          const value = e.target.value as AttendanceOption
                          setRows((prev) => {
                            const updated = [...prev]
                            updated[index] = { ...updated[index], attendance: value }
                            const normalized = ensureLeadingEmptyRow(updated)
                            const payload: NotesDataV1 = { version: 1, rows: normalized }
                            setContent(JSON.stringify(payload))
                            return normalized
                          })
                        }}
                        className={`w-full ${lessonStripFieldClass(lessonNum)}`}
                      >
                        <option value="">-- Select --</option>
                        <option value="YES_ONLINE">Yes – online</option>
                        <option value="YES_IN_PERSON">Yes – in person</option>
                        <option value="NO_NOT_INFORMED">No – not informed</option>
                      </select>
                      </td>

                      {/* Lesson topic */}
                      <td className="px-3 py-2 border-b align-top">
                      <input
                        type="text"
                        data-lesson-strip={dataStrip}
                        value={row.lessonTopic}
                        onChange={(e) => {
                          const value = e.target.value
                          setRows((prev) => {
                            const updated = [...prev]
                            updated[index] = { ...updated[index], lessonTopic: value }
                            const normalized = ensureLeadingEmptyRow(updated)
                            const payload: NotesDataV1 = { version: 1, rows: normalized }
                            setContent(JSON.stringify(payload))
                            return normalized
                          })
                        }}
                        className={`w-full ${lessonStripFieldClass(lessonNum)}`}
                        placeholder="e.g. Part 3 – Conversations in the workplace"
                      />
                      </td>
                    </tr>

                    <tr className={stripClass}>
                      <td className="px-3 py-2 border-b align-top" colSpan={3}>
                        <details
                          className={`rounded-md border shadow-sm ${lessonStripDetailsShellClass(lessonNum)}`}
                          ref={(el) => registerNotesDetailsEl(index, el)}
                        >
                          <summary
                            className={`cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-900 rounded-md ${lessonStripSummaryHoverClass(lessonNum)}`}
                          >
                            Corrections & notes{' '}
                            <span className="font-normal text-gray-500">(optional)</span>
                            {(htmlHasVisibleText(row.corrections) || htmlHasVisibleText(row.notes)) && (
                              <span className="ml-2 text-xs font-normal text-[#38438f]">
                                · saved content
                              </span>
                            )}
                          </summary>
                          <div className={lessonStripDetailsInnerClass(lessonNum)}>
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Corrections</div>
                              <div
                                ref={(el) => {
                                  if (el) editorRefs.current[`${index}-corrections`] = el
                                  if (
                                    el &&
                                    !(focusedEditor?.rowIndex === index && focusedEditor?.field === 'corrections')
                                  ) {
                                    if (el.innerHTML !== row.corrections) el.innerHTML = row.corrections
                                  }
                                }}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => setFocusedEditor({ rowIndex: index, field: 'corrections' })}
                                onInput={(e) => {
                                  const html = (e.currentTarget as HTMLElement).innerHTML
                                  setRows((prev) => {
                                    const updated = [...prev]
                                    updated[index] = { ...updated[index], corrections: html }
                                    const normalized = ensureLeadingEmptyRow(updated)
                                    const payload: NotesDataV1 = { version: 1, rows: normalized }
                                    setContent(JSON.stringify(payload))
                                    return normalized
                                  })
                                }}
                                onBlur={(e) => {
                                  setFocusedEditor(null)
                                  const html = (e.currentTarget as HTMLElement).innerHTML
                                  setRows((prev) => {
                                    const updated = [...prev]
                                    updated[index] = { ...updated[index], corrections: html }
                                    const normalized = ensureLeadingEmptyRow(updated)
                                    const payload: NotesDataV1 = { version: 1, rows: normalized }
                                    setContent(JSON.stringify(payload))
                                    return normalized
                                  })
                                }}
                                data-notes-editor="true"
                                data-row-index={index}
                                data-field="corrections"
                                className={lessonStripEditorClass(lessonNum)}
                              />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Notes</div>
                              <div
                                ref={(el) => {
                                  if (el) editorRefs.current[`${index}-notes`] = el
                                  if (
                                    el &&
                                    !(focusedEditor?.rowIndex === index && focusedEditor?.field === 'notes')
                                  ) {
                                    if (el.innerHTML !== row.notes) el.innerHTML = row.notes
                                  }
                                }}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => setFocusedEditor({ rowIndex: index, field: 'notes' })}
                                onInput={(e) => {
                                  const html = (e.currentTarget as HTMLElement).innerHTML
                                  setRows((prev) => {
                                    const updated = [...prev]
                                    updated[index] = { ...updated[index], notes: html }
                                    const normalized = ensureLeadingEmptyRow(updated)
                                    const payload: NotesDataV1 = { version: 1, rows: normalized }
                                    setContent(JSON.stringify(payload))
                                    return normalized
                                  })
                                }}
                                onBlur={(e) => {
                                  setFocusedEditor(null)
                                  const html = (e.currentTarget as HTMLElement).innerHTML
                                  setRows((prev) => {
                                    const updated = [...prev]
                                    updated[index] = { ...updated[index], notes: html }
                                    const normalized = ensureLeadingEmptyRow(updated)
                                    const payload: NotesDataV1 = { version: 1, rows: normalized }
                                    setContent(JSON.stringify(payload))
                                    return normalized
                                  })
                                }}
                                data-notes-editor="true"
                                data-row-index={index}
                                data-field="notes"
                                className={lessonStripEditorClass(lessonNum)}
                              />
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  </Fragment>
                )})}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="mt-2 text-sm text-gray-500">Loading note...</div>
          )}

          {legacyContent && (
            <div className="mt-4 text-sm text-gray-600">
              <h3 className="font-semibold mb-2">Previous free‑form notes (read‑only):</h3>
              <div
                className="border border-gray-200 rounded p-3 bg-gray-50 text-sm"
                dangerouslySetInnerHTML={{ __html: legacyContent }}
              />
            </div>
          )}
        </>
      )}

    </div>
  )
}
