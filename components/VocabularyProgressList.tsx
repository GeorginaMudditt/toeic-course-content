'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { LEVEL_COLORS } from '@/lib/level-colors'

type TopicProgress = {
  id: string
  topic: string
  bronze: boolean
  silver: boolean
  gold: boolean
  updatedAt: string | null
}

export type VocabularyProgressStudent = {
  id: string
  name: string
  email: string
  vocabularyProgressArchived: boolean
  byLevel: Record<string, TopicProgress[]>
  totalTopics: number
  completedTopics: number
  totalChallenges: number
  completedChallenges: number
}

type FilterValue = 'ACTIVE' | 'HIDDEN' | 'ALL'

type Props = {
  students: VocabularyProgressStudent[]
}

const FILTER_LABELS: Record<FilterValue, string> = {
  ACTIVE: 'Active students only',
  HIDDEN: 'Hidden students only',
  ALL: 'All students',
}

function getLevelColor(level: string) {
  const levelMap: Record<string, string> = {
    a1: LEVEL_COLORS.A1,
    a2: LEVEL_COLORS.A2,
    b1: LEVEL_COLORS.B1,
    b2: LEVEL_COLORS.B2,
    c1: LEVEL_COLORS.C1,
    c2: LEVEL_COLORS.C2,
  }
  return levelMap[level.toLowerCase()] || '#4A4A7D'
}

export default function VocabularyProgressList({ students: initialStudents }: Props) {
  const [students, setStudents] = useState<VocabularyProgressStudent[]>(initialStudents)
  const [filter, setFilter] = useState<FilterValue>('ACTIVE')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const hiddenCount = useMemo(
    () => students.filter((student) => student.vocabularyProgressArchived).length,
    [students]
  )

  const filteredStudents = useMemo(() => {
    if (filter === 'ALL') return students
    if (filter === 'HIDDEN') {
      return students.filter((student) => student.vocabularyProgressArchived)
    }
    return students.filter((student) => !student.vocabularyProgressArchived)
  }, [students, filter])

  const handleVisibilityChange = async (studentId: string, archived: boolean) => {
    setSaveError(null)
    setSavingId(studentId)
    const previous = students.find((student) => student.id === studentId)?.vocabularyProgressArchived
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, vocabularyProgressArchived: archived } : student
      )
    )

    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabularyProgressArchived: archived }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to update visibility'
        setSaveError(message)
        if (previous !== undefined) {
          setStudents((prev) =>
            prev.map((student) =>
              student.id === studentId
                ? { ...student, vocabularyProgressArchived: previous }
                : student
            )
          )
        }
      }
    } catch {
      setSaveError('Failed to update visibility. Check your connection and try again.')
      if (previous !== undefined) {
        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, vocabularyProgressArchived: previous }
              : student
          )
        )
      }
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {saveError}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label htmlFor="vocabulary-progress-filter" className="text-sm font-medium text-gray-700">
            Show students
          </label>
          {hiddenCount > 0 && filter === 'ACTIVE' && (
            <p className="mt-1 text-sm text-gray-500">
              {hiddenCount} hidden student{hiddenCount === 1 ? '' : 's'} not shown.
            </p>
          )}
        </div>
        <select
          id="vocabulary-progress-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterValue)}
          className="block w-full sm:w-72 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#38438f] focus:border-transparent"
        >
          {(Object.keys(FILTER_LABELS) as FilterValue[]).map((value) => (
            <option key={value} value={value}>
              {FILTER_LABELS[value]}
              {value === 'HIDDEN' && hiddenCount > 0 ? ` (${hiddenCount})` : ''}
            </option>
          ))}
        </select>
      </div>

      {students.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">No students found.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">
            {filter === 'HIDDEN'
              ? 'No hidden students yet. Use the dropdown on a student card to hide them from this list.'
              : 'No students match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{student.name}</h2>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
                <div className="sm:min-w-[12rem]">
                  <label
                    htmlFor={`visibility-${student.id}`}
                    className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    Visibility
                  </label>
                  <select
                    id={`visibility-${student.id}`}
                    aria-label={`Visibility for ${student.name}`}
                    value={student.vocabularyProgressArchived ? 'HIDDEN' : 'VISIBLE'}
                    disabled={savingId === student.id}
                    onChange={(e) =>
                      handleVisibilityChange(student.id, e.target.value === 'HIDDEN')
                    }
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#38438f] focus:border-transparent disabled:opacity-60"
                  >
                    <option value="VISIBLE">Show in list</option>
                    <option value="HIDDEN">Hide from list</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-500">
                    {student.completedChallenges} / {student.totalChallenges} challenges completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: '#38438f',
                      width: `${
                        student.totalChallenges > 0
                          ? (student.completedChallenges / student.totalChallenges) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {student.completedTopics} / {student.totalTopics} topics fully completed
                </div>
              </div>

              {Object.keys(student.byLevel).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(student.byLevel).map(([level, topics]) => (
                    <div key={level} className="border-t pt-4">
                      <h3 className="font-medium mb-3" style={{ color: getLevelColor(level) }}>
                        Level {level.toUpperCase()}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Topic
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Challenge 1
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Challenge 2
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Challenge 3
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Completed
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Last Updated
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {topics.map((topicProgress) => {
                              const allCompleted =
                                topicProgress.bronze && topicProgress.silver && topicProgress.gold
                              const completedCount =
                                (topicProgress.bronze ? 1 : 0) +
                                (topicProgress.silver ? 1 : 0) +
                                (topicProgress.gold ? 1 : 0)
                              const lastUpdated = topicProgress.updatedAt
                                ? new Date(topicProgress.updatedAt).toLocaleDateString('en-GB')
                                : '-'

                              return (
                                <tr key={topicProgress.id}>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {topicProgress.topic}
                                  </td>
                                  <td className="px-4 py-2 text-center text-2xl">
                                    {topicProgress.bronze ? '🏅' : '○'}
                                  </td>
                                  <td className="px-4 py-2 text-center text-2xl">
                                    {topicProgress.silver ? '🏅' : '○'}
                                  </td>
                                  <td className="px-4 py-2 text-center text-2xl">
                                    {topicProgress.gold ? '🏅' : '○'}
                                  </td>
                                  <td className="px-4 py-2 text-center text-sm">
                                    {allCompleted ? (
                                      <span className="text-green-600 font-medium">✓ Complete</span>
                                    ) : (
                                      <span className="text-gray-500">{completedCount}/3</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">{lastUpdated}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No vocabulary progress yet.</div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Hidden students stay in Manage Students and keep their progress. Use{' '}
        <Link href="/teacher/students" className="text-[#38438f] hover:underline">
          Manage Students
        </Link>{' '}
        to change lifecycle status.
      </p>
    </div>
  )
}
