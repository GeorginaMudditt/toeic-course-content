'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  STUDENT_LIFECYCLE_FILTER_LABELS,
  STUDENT_LIFECYCLE_LABELS,
  STUDENT_LIFECYCLE_STATUS_VALUES,
  STUDENT_LIFECYCLE_VISUAL,
  type StudentLifecycleStatus,
  normalizeStudentLifecycleStatus,
} from '@/lib/student-lifecycle-status'

export type TeacherStudentRow = {
  id: string
  name: string
  email: string
  studentLifecycleStatus: string | null
}

type FilterValue = 'ALL' | StudentLifecycleStatus

type Props = {
  students: TeacherStudentRow[]
}

export default function TeacherStudentsTable({ students: initialStudents }: Props) {
  const [students, setStudents] = useState<TeacherStudentRow[]>(() =>
    initialStudents.map((s) => ({
      ...s,
      studentLifecycleStatus: normalizeStudentLifecycleStatus(s.studentLifecycleStatus),
    }))
  )
  const [statusFilter, setStatusFilter] = useState<FilterValue>('ALL')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filteredStudents = useMemo(() => {
    if (statusFilter === 'ALL') {
      return students
    }
    return students.filter(
      (s) => normalizeStudentLifecycleStatus(s.studentLifecycleStatus) === statusFilter
    )
  }, [students, statusFilter])

  const handleStatusChange = async (studentId: string, next: StudentLifecycleStatus) => {
    setSaveError(null)
    setSavingId(studentId)
    const previous = students.find((s) => s.id === studentId)?.studentLifecycleStatus
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, studentLifecycleStatus: next } : s))
    )
    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentLifecycleStatus: next }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to update status'
        setSaveError(message)
        if (previous !== undefined) {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId ? { ...s, studentLifecycleStatus: previous } : s
            )
          )
        }
      }
    } catch {
      setSaveError('Failed to update status. Check your connection and try again.')
      if (previous !== undefined) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId ? { ...s, studentLifecycleStatus: previous } : s
          )
        )
      }
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="student-status-filter" className="text-sm font-medium text-gray-700">
          Show students
        </label>
        <select
          id="student-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterValue)}
          className="block w-full sm:w-72 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#38438f] focus:border-transparent"
        >
          <option value="ALL">All students</option>
          {STUDENT_LIFECYCLE_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {STUDENT_LIFECYCLE_FILTER_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {students.length === 0
                    ? 'No students yet. Add your first student!'
                    : 'No students match this filter.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const value = normalizeStudentLifecycleStatus(student.studentLifecycleStatus)
                const visual = STUDENT_LIFECYCLE_VISUAL[value]
                return (
                  <tr key={student.id} className={visual.rowClass}>
                    <td className={`px-6 py-4 whitespace-nowrap ${visual.leftStripeClass}`}>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <select
                        aria-label={`Status for ${student.name}`}
                        value={value}
                        disabled={savingId === student.id}
                        onChange={(e) =>
                          handleStatusChange(student.id, e.target.value as StudentLifecycleStatus)
                        }
                        className={`block w-full max-w-[13rem] border-2 rounded-md px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60 ${visual.selectClass}`}
                      >
                        {STUDENT_LIFECYCLE_STATUS_VALUES.map((v) => (
                          <option key={v} value={v}>
                            {STUDENT_LIFECYCLE_LABELS[v]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/teacher/students/${student.id}`}
                        className="transition-colors hover:text-[#2d3569]"
                        style={{ color: '#38438f' }}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
