'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export type StudentFolder = {
  id: string
  name: string
  canUnarchive?: boolean
}

type Props = {
  students: StudentFolder[]
  archivedCount?: number
  mode?: 'active' | 'archive'
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h4.318a2.25 2.25 0 0 1 1.591.659l1.182 1.182A2.25 2.25 0 0 0 14.682 7.5H18.75A2.25 2.25 0 0 1 21 9.75v8.25A2.25 2.25 0 0 1 18.75 20.25H5.25A2.25 2.25 0 0 1 3 18V6.75Z" />
    </svg>
  )
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5h16M6 7.5V18a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 18V7.5M9 10.5h6"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 4.5h4.5L15 7.5H9l.75-3Z" />
    </svg>
  )
}

function UnarchiveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

export default function StudentFolders({
  students,
  archivedCount = 0,
  mode = 'active',
}: Props) {
  const router = useRouter()
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const handleArchive = async (student: StudentFolder) => {
    const confirmed = window.confirm(
      `Hide ${student.name}'s folder from the dashboard? They will stay active in the Students tab.`
    )
    if (!confirmed) return

    setArchiveError(null)
    setArchivingId(student.id)

    try {
      const response = await fetch(`/api/users/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardFolderArchived: true }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to archive folder'
        setArchiveError(message)
        return
      }

      router.refresh()
    } catch {
      setArchiveError('Failed to archive folder. Check your connection and try again.')
    } finally {
      setArchivingId(null)
    }
  }

  const handleUnarchive = async (student: StudentFolder) => {
    setArchiveError(null)
    setArchivingId(student.id)

    try {
      const response = await fetch(`/api/users/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardFolderArchived: false }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to restore folder'
        setArchiveError(message)
        return
      }

      router.refresh()
    } catch {
      setArchiveError('Failed to restore folder. Check your connection and try again.')
    } finally {
      setArchivingId(null)
    }
  }

  const isArchiveView = mode === 'archive'

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {isArchiveView ? 'Archived Folders' : 'Student Folders'}
      </h2>

      {archiveError && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {archiveError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {!isArchiveView && (
          <Link
            href="/teacher/onboarding/archive"
            className="group flex flex-col items-center rounded-lg border border-slate-300 bg-slate-100 p-4 shadow-sm transition-colors hover:border-slate-500 hover:bg-slate-200"
          >
            <FolderIcon className="mb-2 h-12 w-12 text-slate-600 transition-transform group-hover:scale-105" />
            <span className="w-full truncate text-center text-sm font-medium text-slate-800">
              Archive{archivedCount > 0 ? ` (${archivedCount})` : ''}
            </span>
          </Link>
        )}

        {students.map((student) => (
          <div
            key={student.id}
            className={`group relative rounded-lg border p-4 shadow-sm transition-colors ${
              isArchiveView
                ? 'border-slate-300 bg-slate-50 hover:border-slate-500 hover:bg-slate-100'
                : 'border-gray-200 bg-white hover:border-[#38438f] hover:bg-[#e8eaf6]'
            }`}
          >
            {!isArchiveView && (
              <button
                type="button"
                onClick={() => handleArchive(student)}
                disabled={archivingId === student.id}
                className="absolute right-2 top-2 rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-50"
                title="Hide from dashboard"
                aria-label={`Hide ${student.name} from dashboard`}
              >
                <ArchiveIcon className="h-3.5 w-3.5" />
              </button>
            )}

            {isArchiveView && student.canUnarchive && (
              <button
                type="button"
                onClick={() => handleUnarchive(student)}
                disabled={archivingId === student.id}
                className="absolute right-2 top-2 rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-[#38438f] disabled:opacity-50"
                title="Restore to dashboard"
                aria-label={`Restore ${student.name} to dashboard`}
              >
                <UnarchiveIcon className="h-3.5 w-3.5" />
              </button>
            )}

            <Link
              href={`/teacher/dashboard/students/${student.id}`}
              className="flex flex-col items-center"
            >
              <FolderIcon
                className={`mb-2 h-12 w-12 transition-transform group-hover:scale-105 ${
                  isArchiveView ? 'text-slate-600' : 'text-[#38438f]'
                }`}
              />
              <span className="w-full truncate text-center text-sm font-medium text-gray-900">
                {student.name}
              </span>
            </Link>
          </div>
        ))}

        {!isArchiveView && (
          <Link
            href="/teacher/students/new"
            className="flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 transition-colors hover:border-[#38438f] hover:bg-[#e8eaf6]"
          >
            <div
              className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-light text-[#38438f]"
              aria-hidden="true"
            >
              +
            </div>
            <span className="text-center text-sm font-medium text-gray-700">Add Student</span>
          </Link>
        )}
      </div>

      {isArchiveView && students.length === 0 && (
        <p className="text-sm text-gray-500">No archived folders yet.</p>
      )}
    </section>
  )
}
