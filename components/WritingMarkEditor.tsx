'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  diffToMarkedHtml,
  parseRevisedFromMarkedHtml,
} from '@/lib/writing-mark-diff'
import type { WritingSubmissionRow } from '@/lib/writing-submissions'

type Props = {
  submission: WritingSubmissionRow
  studentId: string
}

export default function WritingMarkEditor({ submission, studentId }: Props) {
  const router = useRouter()
  const baselineText = submission.originalText || ''
  const [revisedText, setRevisedText] = useState(baselineText)
  const [teacherComments, setTeacherComments] = useState(submission.teacherComments || '')
  const [score, setScore] = useState(
    submission.score != null && Number.isFinite(submission.score) ? String(submission.score) : '',
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (submission.markedHtml) {
      setRevisedText(parseRevisedFromMarkedHtml(submission.markedHtml))
    } else {
      setRevisedText(baselineText)
    }
  }, [submission.id, submission.markedHtml, baselineText])

  const markedHtml = useMemo(
    () => diffToMarkedHtml(baselineText, revisedText),
    [baselineText, revisedText],
  )

  const hasCorrections = baselineText !== revisedText

  const save = async (publish: boolean) => {
    setSaving(true)
    setError(null)
    setMessage(null)

    const parsedScore = score.trim() === '' ? null : Number(score)
    if (score.trim() !== '' && !Number.isFinite(parsedScore)) {
      setError('Score must be a number')
      setSaving(false)
      return
    }

    let notifyStudent = false
    if (publish) {
      notifyStudent = window.confirm(
        'Would you like to let the student know you have marked their work?',
      )
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
          notifyStudent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save')
      }

      const result = await response.json().catch(() => ({}))

      if (!publish) {
        setMessage('Draft corrections saved.')
      } else if (notifyStudent && result.studentNotified) {
        setMessage('Marked and shared with the student. Notification email sent.')
      } else if (notifyStudent && result.notifyError) {
        setMessage(
          `Marked and shared with the student, but the notification email could not be sent (${result.notifyError}).`,
        )
      } else if (notifyStudent) {
        setMessage('Marked and shared with the student, but the notification email could not be sent.')
      } else {
        setMessage('Marked and shared with the student. No email sent.')
      }
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
          {baselineText ? (
            <div className="mt-2 whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 font-serif">
              {baselineText}
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
            Edit the text below as you would in a word processor. Deletions and insertions are
            tracked automatically —{' '}
            <span className="text-red-600 line-through">red strikethrough</span> for removed words
            and <span className="text-red-600 font-medium">red text</span> for additions /
            corrections. No manual highlighting needed.
          </p>
        </div>

        {baselineText ? (
          <>
            <div>
              <label htmlFor="writing-revised-text" className="block text-sm font-medium text-gray-700 mb-1">
                Your corrected version
              </label>
              <textarea
                id="writing-revised-text"
                value={revisedText}
                onChange={(e) => setRevisedText(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-gray-300 p-4 text-sm leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-[#38438f]"
                spellCheck
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Preview — what the student will see
                {!hasCorrections && (
                  <span className="font-normal text-gray-500"> (no changes yet)</span>
                )}
              </p>
              <div
                className="min-h-[120px] rounded-md border border-indigo-200 bg-indigo-50/40 p-4 text-sm leading-relaxed font-serif writing-mark-preview"
                dangerouslySetInnerHTML={{ __html: markedHtml }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            This submission has no typed text to mark inline. Use overall comments below and refer to
            the attached file.
          </p>
        )}

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
            .writing-mark-preview p { margin: 0 0 0.75em; }
            .writing-mark-preview .wc-ins { color: #dc2626; }
            .writing-mark-preview .wc-del,
            .writing-mark-preview .wc-del s,
            .writing-mark-preview strike,
            .writing-mark-preview s { color: #dc2626; }
          `,
        }}
      />
    </div>
  )
}
