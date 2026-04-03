'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Assignment {
  id: string
  assignedAt: string
  resource: {
    id: string
    title: string
    estimatedHours: number
    type: string
    level: string
    skill?: string
    createdAt: string
  } | null
  progress: any[]
}

function formatSkill(skill: string | undefined): string {
  if (!skill) return 'Resource'
  // Convert ENUM-like values into readable labels (TRAVEL_ENGLISH -> Travel English)
  return skill
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

interface Props {
  assignments: Assignment[]
  viewAs?: string
}

type SortOption = 'date' | 'level' | 'alphabetical'

type ProgressStatusKey = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

function getAssignmentStatus(assignment: Assignment): ProgressStatusKey {
  const progress = Array.isArray(assignment.progress) ? assignment.progress[0] : null
  const raw = progress?.status as string | undefined
  if (raw === 'IN_PROGRESS' || raw === 'COMPLETED') {
    return raw
  }
  return 'NOT_STARTED'
}

export default function AssignmentsList({ assignments, viewAs }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [showStatuses, setShowStatuses] = useState<Record<ProgressStatusKey, boolean>>({
    NOT_STARTED: true,
    IN_PROGRESS: true,
    COMPLETED: true,
  })

  // Check if assignment has been viewed (has progress record)
  const hasBeenViewed = (assignment: Assignment) => {
    return assignment.progress && assignment.progress.length > 0
  }

  // Filter by selected statuses, then sort
  const sortedAssignments = useMemo(() => {
    const anyStatusSelected =
      showStatuses.NOT_STARTED || showStatuses.IN_PROGRESS || showStatuses.COMPLETED
    const filtered = anyStatusSelected
      ? assignments.filter((a) => showStatuses[getAssignmentStatus(a)])
      : []

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'level': {
          // Sort by level: A1, A2, B1, B2, C1, C2
          const levelOrder: { [key: string]: number } = {
            'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
          }
          const aLevel = a.resource ? (levelOrder[a.resource.level] || 999) : 999
          const bLevel = b.resource ? (levelOrder[b.resource.level] || 999) : 999
          if (aLevel !== bLevel) {
            return aLevel - bLevel
          }
          // If same level, sort alphabetically by title
          const aTitle = a.resource?.title || ''
          const bTitle = b.resource?.title || ''
          return aTitle.localeCompare(bTitle)
        }
        case 'alphabetical': {
          const aTitle = a.resource?.title || ''
          const bTitle = b.resource?.title || ''
          return aTitle.localeCompare(bTitle)
        }
        case 'date':
        default: {
          // Sort by assignedAt date (newest first)
          const aDate = a.assignedAt ? new Date(a.assignedAt).getTime() : 0
          const bDate = b.assignedAt ? new Date(b.assignedAt).getTime() : 0
          return bDate - aDate
        }
      }
    })
  }, [assignments, sortBy, showStatuses])

  const toggleStatus = (key: ProgressStatusKey) => {
    setShowStatuses((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const anyStatusSelected =
    showStatuses.NOT_STARTED || showStatuses.IN_PROGRESS || showStatuses.COMPLETED

  const emptyMessage = (() => {
    if (assignments.length === 0) {
      return 'No assignments yet.'
    }
    if (!anyStatusSelected) {
      return 'Tick at least one status under Show to see assignments.'
    }
    if (sortedAssignments.length === 0) {
      return 'No assignments match the statuses you selected. Try ticking another box.'
    }
    return null
  })()

  return (
    <div>
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:justify-between sm:items-start">
        <h3 className="text-sm font-medium text-gray-700 shrink-0">Assignments</h3>
        <div className="flex flex-col gap-4 w-full sm:w-auto sm:items-end">
          <fieldset className="w-full sm:min-w-[280px] border border-gray-200 rounded-md p-3 bg-gray-50/50">
            <legend className="text-sm font-medium text-gray-700 px-1">Show</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-900 focus:ring-offset-0 focus:ring-[#38438f]"
                  checked={showStatuses.NOT_STARTED}
                  onChange={() => toggleStatus('NOT_STARTED')}
                />
                Not started
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-900 focus:ring-offset-0 focus:ring-[#38438f]"
                  checked={showStatuses.IN_PROGRESS}
                  onChange={() => toggleStatus('IN_PROGRESS')}
                />
                In progress
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-900 focus:ring-offset-0 focus:ring-[#38438f]"
                  checked={showStatuses.COMPLETED}
                  onChange={() => toggleStatus('COMPLETED')}
                />
                Completed
              </label>
            </div>
          </fieldset>
          <div className="w-full sm:w-72">
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none w-full text-sm"
              onFocus={(e) => (e.currentTarget.style.borderColor = '#38438f')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              <option value="date">Date Added (Newest First)</option>
              <option value="level">Level</option>
              <option value="alphabetical">Alphabetically</option>
            </select>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {sortedAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          sortedAssignments.map((assignment) => {
            const progress = Array.isArray(assignment.progress) ? assignment.progress[0] : null
            const status = progress?.status || 'NOT_STARTED'
            const isNew = !hasBeenViewed(assignment)
            
            return (
              <Link
                key={assignment.id}
                href={viewAs ? `/student/assignment/${assignment.id}?viewAs=${viewAs}` : `/student/assignment/${assignment.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {isNew && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-white shadow-md" style={{ backgroundColor: '#ef4444' }}>
                        NEW!
                      </span>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {assignment.resource?.title || 'Unknown Resource'}
                      </div>
                      {assignment.resource && (
                        <div className="text-sm text-gray-500">
                          {assignment.resource.estimatedHours}h • {formatSkill(assignment.resource.skill)} • Level {assignment.resource.level}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">
                    {status === 'COMPLETED' && (
                      <span className="text-green-600 font-medium">✓ Completed</span>
                    )}
                    {status === 'IN_PROGRESS' && (
                      <span className="font-medium" style={{ color: '#38438f' }}>In Progress</span>
                    )}
                    {status === 'NOT_STARTED' && (
                      <span className="text-gray-500">Not Started</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
