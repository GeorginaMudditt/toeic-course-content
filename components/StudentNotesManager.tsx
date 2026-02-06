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

export default function StudentNotesManager({ student, enrollments }: Props) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Load note when enrollment changes
  useEffect(() => {
    if (selectedEnrollment) {
      loadNote(selectedEnrollment)
    } else {
      setContent('')
    }
  }, [selectedEnrollment])

  const loadNote = async (enrollmentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/course-notes/${enrollmentId}`)
      const data = await response.json()
      
      if (data.note) {
        setContent(data.note.content || '')
        if (editorRef.current) {
          editorRef.current.innerHTML = data.note.content || ''
        }
      } else {
        setContent('')
        if (editorRef.current) {
          editorRef.current.innerHTML = ''
        }
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

    setSaving(true)
    try {
      const contentToSave = editorRef.current?.innerHTML || ''
      
      const response = await fetch(`/api/course-notes/${selectedEnrollment}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contentToSave }),
      })

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      setLastSaved(new Date())
      setContent(contentToSave)
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Error saving note')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!selectedEnrollment || !content) return

    const interval = setInterval(() => {
      if (editorRef.current && editorRef.current.innerHTML !== content) {
        saveNote()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedEnrollment, content])

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      editorRef.current.focus()
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
    
    const dateElement = document.createElement('p')
    dateElement.style.fontWeight = 'bold'
    dateElement.style.marginTop = '16px'
    dateElement.style.marginBottom = '8px'
    dateElement.textContent = dateStr
    
    if (editorRef.current) {
      editorRef.current.appendChild(dateElement)
      editorRef.current.focus()
    }
  }

  const setTextColor = (color: string) => {
    document.execCommand('foreColor', false, color)
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  const setHighlightColor = (color: string) => {
    document.execCommand('backColor', false, color)
    if (editorRef.current) {
      editorRef.current.focus()
    }
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
        <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Course:
        </label>
        <select
          id="course-select"
          value={selectedEnrollment}
          onChange={(e) => setSelectedEnrollment(e.target.value)}
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
        >
          <option value="">-- Select a course --</option>
          {enrollments.map((enrollment) => (
            <option key={enrollment.id} value={enrollment.id}>
              {enrollment.course 
                ? formatCourseName(enrollment.course.name, enrollment.course.duration)
                : 'Unknown Course'}
            </option>
          ))}
        </select>
      </div>

      {selectedEnrollment && (
        <>
          {/* Toolbar */}
          <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => formatText('bold')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => formatText('underline')}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Underline"
            >
              <u>U</u>
            </button>
            <div className="border-l border-gray-300 mx-1" />
            <select
              onChange={(e) => formatText('fontSize', e.target.value)}
              className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Font Size"
            >
              <option value="1">Small</option>
              <option value="3">Normal</option>
              <option value="5">Large</option>
              <option value="7">Extra Large</option>
            </select>
            <div className="border-l border-gray-300 mx-1" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 px-2">Text:</span>
              <button
                type="button"
                onClick={() => setTextColor('red')}
                className="w-6 h-6 bg-red-500 border border-gray-300 rounded hover:opacity-80"
                title="Red Text"
              />
              <button
                type="button"
                onClick={() => setTextColor('green')}
                className="w-6 h-6 bg-green-500 border border-gray-300 rounded hover:opacity-80"
                title="Green Text"
              />
              <button
                type="button"
                onClick={() => setTextColor('blue')}
                className="w-6 h-6 bg-blue-500 border border-gray-300 rounded hover:opacity-80"
                title="Blue Text"
              />
            </div>
            <div className="border-l border-gray-300 mx-1" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 px-2">Highlight:</span>
              <button
                type="button"
                onClick={() => setHighlightColor('#FFEB3B')}
                className="w-6 h-6 bg-yellow-300 border border-gray-300 rounded hover:opacity-80"
                title="Yellow Highlight"
              />
              <button
                type="button"
                onClick={() => setHighlightColor('#FF9800')}
                className="w-6 h-6 bg-orange-400 border border-gray-300 rounded hover:opacity-80"
                title="Orange Highlight"
              />
              <button
                type="button"
                onClick={() => setHighlightColor('#FF69B4')}
                className="w-6 h-6 bg-pink-400 border border-gray-300 rounded hover:opacity-80"
                title="Pink Highlight"
              />
            </div>
            <div className="border-l border-gray-300 mx-1" />
            <button
              type="button"
              onClick={insertDate}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              title="Insert Date"
            >
              📅 Insert Date
            </button>
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

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) => {
              const html = (e.target as HTMLElement).innerHTML
              setContent(html)
            }}
            className="border border-t-0 border-gray-300 rounded-b-lg p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-[#38438f]"
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
            suppressContentEditableWarning
          />

          {loading && (
            <div className="mt-2 text-sm text-gray-500">Loading note...</div>
          )}
        </>
      )}

      {!selectedEnrollment && (
        <div className="text-center py-12 text-gray-500">
          <p>Select a course above to start taking notes</p>
        </div>
      )}
    </div>
  )
}
