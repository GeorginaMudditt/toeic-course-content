'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WritingSubmissionForm from '@/components/WritingSubmissionForm'
import {
  formatFileSize,
  statusLabel,
  type WritingSubmissionRow,
} from '@/lib/writing-submissions'
import { formatUKDate } from '@/lib/date-utils'

type Props = {
  studentId: string
  submissions: WritingSubmissionRow[]
}

export default function WritingSubmissionsManager({ studentId, submissions: initial }: Props) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshList = async () => {
    try {
      const res = await fetch(`/api/writing-submissions?studentId=${encodeURIComponent(studentId)}`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error(error)
    }
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this writing submission? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/writing-submissions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Failed to delete submission')
        return
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to delete submission')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <WritingSubmissionForm studentId={studentId} onSubmitted={refreshList} compact />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#38438f' }}>
            Writing submissions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Mark typed writing with red tracked corrections. Open attached files for handwritten work.
          </p>
        </div>

        {submissions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No writing submitted yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <li key={submission.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{submission.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {statusLabel(submission.status)}
                    {' · '}
                    submitted {formatUKDate(new Date(submission.submittedAt))}
                    {submission.uploadedById ? ' · uploaded by you' : ''}
                    {submission.fileName
                      ? ` · ${submission.fileName}${submission.fileSize ? ` (${formatFileSize(submission.fileSize)})` : ''}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    href={`/teacher/students/${studentId}/writing/${submission.id}`}
                    className="px-3 py-1.5 text-sm rounded-md bg-[#38438f] text-white hover:opacity-90"
                  >
                    {submission.status === 'MARKED' ? 'View / edit marking' : 'Mark'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(submission.id)}
                    disabled={deletingId === submission.id}
                    className="px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
