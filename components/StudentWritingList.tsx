'use client'

import Link from 'next/link'
import {
  formatFileSize,
  statusLabel,
  type WritingSubmissionRow,
} from '@/lib/writing-submissions'
import { formatUKDate } from '@/lib/date-utils'

type Props = {
  submissions: WritingSubmissionRow[]
  viewAs?: string
}

export default function StudentWritingList({ submissions, viewAs }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#38438f' }}>
          Your submissions
        </h2>
        <p className="text-sm text-gray-500 mt-3">No writing submitted yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#38438f' }}>
          Your submissions
        </h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {submissions.map((submission) => {
          const href = viewAs
            ? `/student/writing/${submission.id}?viewAs=${viewAs}`
            : `/student/writing/${submission.id}`
          return (
            <li key={submission.id}>
              <Link
                href={href}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="font-medium text-gray-900">{submission.title}</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                      submission.status === 'MARKED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {statusLabel(submission.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Submitted {formatUKDate(submission.submittedAt)}
                  {submission.uploadedById ? ' · added by your teacher' : ''}
                  {submission.fileName
                    ? ` · ${submission.fileName}${
                        submission.fileSize ? ` (${formatFileSize(submission.fileSize)})` : ''
                      }`
                    : ''}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
