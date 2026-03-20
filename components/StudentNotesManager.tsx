'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCourseName } from '@/lib/date-utils'

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
  attendance: AttendanceOption
  lessonTopic: string
  corrections: string
  notes: string
}

interface NotesDataV1 {
  version: 1
  rows: LessonRow[]
}

const createEmptyRow = (): LessonRow => ({
  date: '',
  attendance: '',
  lessonTopic: '',
  corrections: '',
  notes: '',
})

const hasContent = (row: LessonRow) =>
  !!(row.date || row.attendance || row.lessonTopic || row.corrections || row.notes)

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
    // First row has content - add a new empty row at the top
    return [createEmptyRow(), first, ...normalizedRest]
  }

  // First row is already empty - keep it, remove other empty rows
  return [first, ...normalizedRest]
}

export default function StudentNotesManager({ student, enrollments }: Props) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>(enrollments[0]?.id ?? '')
  const [content, setContent] = useState<string>('') // Raw content stored in DB (JSON string for new format)
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null)
  const [noteLoaded, setNoteLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [rows, setRows] = useState<LessonRow[]>([createEmptyRow()])
  const [legacyContent, setLegacyContent] = useState<string | null>(null) // For any old free-form notes
  const [showNextLessonEditors, setShowNextLessonEditors] = useState(false)
  // Track which editor has focus — we never overwrite that div's DOM so cursor and content stay correct
  const [focusedEditor, setFocusedEditor] = useState<{ rowIndex: number; field: 'corrections' | 'notes' } | null>(null)
  // Refs for each contentEditable; we set innerHTML only when that editor does NOT have focus
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Refs used by auto-save so we don't restart intervals on every keystroke.
  const contentRef = useRef<string>(content)
  const noteUpdatedAtRef = useRef<string | null>(noteUpdatedAt)
  const lastSavedContentRef = useRef<string>('')
  const noteLoadedRef = useRef<boolean>(noteLoaded)
  const savingRef = useRef<boolean>(false)

  // Load note when enrollment changes
  useEffect(() => {
    if (selectedEnrollment) {
      setNoteLoaded(false)
      noteLoadedRef.current = false
      loadNote(selectedEnrollment)
    } else {
      setContent('')
      setNoteUpdatedAt(null)
      noteUpdatedAtRef.current = null
      setNoteLoaded(false)
      noteLoadedRef.current = false
      lastSavedContentRef.current = ''
      setRows([createEmptyRow()])
      setLegacyContent(null)
    }
  }, [selectedEnrollment])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    noteUpdatedAtRef.current = noteUpdatedAt
  }, [noteUpdatedAt])

  const loadNote = async (enrollmentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/course-notes/${enrollmentId}`)
      const data = await response.json()

      if (data.note && typeof data.note.content === 'string') {
        const raw = data.note.content as string
        setContent(raw)
        contentRef.current = raw
        lastSavedContentRef.current = raw

        const updatedAt = typeof data.note.updatedAt === 'string' ? data.note.updatedAt : null
        setNoteUpdatedAt(updatedAt)
        noteUpdatedAtRef.current = updatedAt
        setNoteLoaded(true)
        noteLoadedRef.current = true

        // Try to parse as structured notes (JSON)
        try {
          const parsed = JSON.parse(raw) as NotesDataV1
          if (parsed && parsed.version === 1 && Array.isArray(parsed.rows)) {
            const normalized = ensureLeadingEmptyRow(parsed.rows)
            setRows(normalized)
            setLegacyContent(null)
            return
          }
        } catch {
          // Not JSON – treat as legacy content
        }

        // Legacy content: keep it for reference, start with a fresh table
        setLegacyContent(raw)
        setRows([createEmptyRow()])
      } else {
        // No existing note – start with a single empty row
        setContent('')
        contentRef.current = ''
        lastSavedContentRef.current = ''
        setNoteUpdatedAt(null)
        noteUpdatedAtRef.current = null
        setNoteLoaded(true)
        noteLoadedRef.current = true
        setLegacyContent(null)
        setRows([createEmptyRow()])
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
    if (contentToSave === lastSavedContentRef.current) return // nothing changed since last confirmed save

    savingRef.current = true
    setSaving(true)
    try {
      const expectedUpdatedAt = noteUpdatedAtRef.current

      const response = await fetch(`/api/course-notes/${selectedEnrollment}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentToSave, expectedUpdatedAt }),
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
      lastSavedContentRef.current = contentToSave
      setLastSaved(new Date())
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
      <div className="mb-4">
        {enrollments.length > 1 ? (
          <>
            <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Course:
            </label>
            <select
              id="course-select"
              value={selectedEnrollment}
              onChange={(e) => setSelectedEnrollment(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
            >
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.course
                    ? formatCourseName(enrollment.course.name, enrollment.course.duration)
                    : 'Unknown Course'}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div>
            <p className="text-sm text-gray-700 font-medium">Course:</p>
            <p className="text-sm text-gray-900">
              {enrollments[0].course
                ? formatCourseName(enrollments[0].course.name, enrollments[0].course.duration)
                : 'Unknown Course'}
            </p>
          </div>
        )}
      </div>

      {selectedEnrollment && (
        <>
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
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-40">Date</th>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-48">Attendance</th>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-64">Lesson topic</th>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-72">Corrections</th>
                  <th className="px-3 py-2 border-b text-left font-semibold text-gray-700 w-72">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isFirstRow = index === 0
                  const rowHasContent = hasContent(row)

                  return (
                  <>
                    <tr key={`${index}-meta`} className={isFirstRow ? 'bg-white' : 'bg-gray-50'}>
                      {/* Date */}
                      <td className="px-3 py-2 border-b align-top">
                      <input
                        type="text"
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
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                        placeholder="e.g. Friday 6 February 2026"
                      />
                      </td>

                      {/* Attendance */}
                      <td className="px-3 py-2 border-b align-top">
                      <select
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
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#38438f]"
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
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                        placeholder="e.g. Part 3 – Conversations in the workplace"
                      />
                      </td>

                      {/* Corrections column header (for alignment only) */}
                      <td className="px-3 py-2 border-b align-top text-sm font-semibold text-gray-700">
                        Corrections
                      </td>

                      {/* Notes column header (for alignment only) */}
                      <td className="px-3 py-2 border-b align-top text-sm font-semibold text-gray-700">
                        Notes
                      </td>
                    </tr>

                    {/* Corrections / Notes editors */}
                    {isFirstRow && !rowHasContent && !showNextLessonEditors ? (
                      <tr key={`${index}-collapsed`} className="bg-white">
                        <td className="px-3 py-3 border-b align-top" colSpan={5}>
                          <button
                            type="button"
                            onClick={() => setShowNextLessonEditors(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show Corrections &amp; Notes for next lesson
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {/* Corrections editor row */}
                        <tr key={`${index}-corrections`} className={isFirstRow ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 border-b align-top" colSpan={5}>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Corrections</div>
                            <div
                              ref={(el) => {
                                if (el) editorRefs.current[`${index}-corrections`] = el
                                if (el && !(focusedEditor?.rowIndex === index && focusedEditor?.field === 'corrections')) {
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
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#38438f] min-h-[140px]"
                              style={{ whiteSpace: 'pre-wrap', color: '#000', backgroundColor: '#fff' }}
                            />
                          </td>
                        </tr>

                        {/* Notes editor row */}
                        <tr key={`${index}-notes`} className={isFirstRow ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 border-b align-top" colSpan={5}>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Notes</div>
                            <div
                              ref={(el) => {
                                if (el) editorRefs.current[`${index}-notes`] = el
                                if (el && !(focusedEditor?.rowIndex === index && focusedEditor?.field === 'notes')) {
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
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#38438f] min-h-[140px]"
                              style={{ whiteSpace: 'pre-wrap', color: '#000', backgroundColor: '#fff' }}
                            />
                          </td>
                        </tr>
                      </>
                    )}
                  </>
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
