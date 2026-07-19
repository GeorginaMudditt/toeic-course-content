'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { plainTextToEditableHtml, type WritingSubmissionRow } from '@/lib/writing-submissions'

type Props = {
  submission: WritingSubmissionRow
  studentId: string
}

export default function WritingMarkEditor({ submission, studentId }: Props) {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const [teacherComments, setTeacherComments] = useState(submission.teacherComments || '')
  const [score, setScore] = useState(
    submission.score != null && Number.isFinite(submission.score) ? String(submission.score) : ''
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (submission.markedHtml) {
      el.innerHTML = submission.markedHtml
    } else {
      el.innerHTML = plainTextToEditableHtml(submission.originalText || '')
    }
  }, [submission.id, submission.markedHtml, submission.originalText])

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const markDeletion = () => {
    editorRef.current?.focus()
    document.execCommand('strikeThrough')
    document.execCommand('foreColor', false, '#dc2626')
  }

  const markInsertion = () => {
    editorRef.current?.focus()
    document.execCommand('foreColor', false, '#dc2626')
  }

  const save = async (publish: boolean) => {
    setSaving(true)
    setError(null)
    setMessage(null)

    const markedHtml = editorRef.current?.innerHTML || ''
    const parsedScore = score.trim() === '' ? null : Number(score)
    if (score.trim() !== '' && !Number.isFinite(parsedScore)) {
      setError('Score must be a number')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/writing-submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markedHtml,
          teacherComments,
          score: parsedScore,
          publish,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save')
      }

      setMessage(publish ? 'Marked and shared with the student.' : 'Draft corrections saved.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Original writing</h2>
          {submission.originalText ? (
            <div className="mt-2 whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 font-serif">
              {submission.originalText}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500 italic">No typed text — see attached file below.</p>
          )}
          {submission.fileUrl && (
            <p className="mt-3 text-sm">
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#38438f] underline"
              >
                Open attached file{submission.fileName ? `: ${submission.fileName}` : ''}
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Mark with tracked corrections</h2>
          <p className="text-sm text-gray-600 mt-1">
            Edit the copy below. Use <span className="text-red-600 line-through">red strikethrough</span> for
            deletions and <span className="text-red-600 font-medium">red text</span> for insertions / corrections.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => runCommand('bold')}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 font-bold"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => runCommand('italic')}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 italic"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={markDeletion}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-red-600 line-through"
            title="Mark selection as deletion (red strikethrough)"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={markInsertion}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-red-600 font-medium"
            title="Mark selection / typing as insertion (red)"
          >
            Insert / correct
          </button>
          <button
            type="button"
            onClick={() => runCommand('foreColor', '#000000')}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            title="Black text"
          >
            Black
          </button>
          <button
            type="button"
            onClick={() => runCommand('removeFormat')}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            title="Clear formatting"
          >
            Clear format
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[240px] rounded-md border border-gray-300 p-4 text-sm leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-[#38438f] writing-mark-editor"
        />

        <div>
          <label htmlFor="teacher-comments" className="block text-sm font-medium text-gray-700 mb-1">
            Overall comments (shown to student)
          </label>
          <textarea
            id="teacher-comments"
            value={teacherComments}
            onChange={(e) => setTeacherComments(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38438f]"
            placeholder="Encouragement, main priorities for next time…"
          />
        </div>

        <div className="max-w-xs">
          <label htmlFor="writing-score" className="block text-sm font-medium text-gray-700 mb-1">
            Score (optional)
          </label>
          <input
            id="writing-score"
            type="number"
            step="any"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38438f]"
            placeholder="e.g. 140"
          />
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700" role="status">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="px-4 py-2 bg-[#38438f] text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Mark & share with student'}
          </button>
          <a
            href={`/teacher/students/${studentId}?tab=writing`}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 self-center"
          >
            Back to student
          </a>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .writing-mark-editor p { margin: 0 0 0.75em; }
            .writing-mark-editor strike,
            .writing-mark-editor s { color: #dc2626; }
          `,
        }}
      />
    </div>
  )
}
