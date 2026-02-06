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
    createdAt: string
  } | null
  progress: any[]
}

interface Props {
  assignments: Assignment[]
  viewAs?: string
}

type SortOption = 'date' | 'level' | 'alphabetical'

export default function AssignmentsList({ assignments, viewAs }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>('date')

  // Check if assignment has been viewed (has progress record)
  const hasBeenViewed = (assignment: Assignment) => {
    return assignment.progress && assignment.progress.length > 0
  }

  // Sort assignments
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
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
  }, [assignments, sortBy])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">Assignments</h3>
        <div className="w-72">
          <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none w-full text-sm"
            onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            <option value="date">Date Added (Newest First)</option>
            <option value="level">Level</option>
            <option value="alphabetical">Alphabetically</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        {sortedAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">No assignments yet.</p>
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
                          {assignment.resource.estimatedHours}h • {assignment.resource.type} • Level {assignment.resource.level}
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
