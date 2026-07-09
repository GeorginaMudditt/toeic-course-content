'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { SavedSectionCard } from '@/lib/resource-bookmarks'

export default function SavedSectionsPanel({
  sections,
}: {
  sections: SavedSectionCard[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(sections)
  const [removingId, setRemovingId] = useState<string | null>(null)

  if (items.length === 0) {
    return null
  }

  const handleRemove = async (item: SavedSectionCard) => {
    setRemovingId(item.id)
    try {
      const response = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: item.assignmentId,
          resourceId: item.resourceId,
          sectionSlug: item.sectionSlug,
          sectionLabel: item.sectionLabel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove bookmark')
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id))
      router.refresh()
    } catch {
      window.alert('Could not remove this saved section. Please try again.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Saved sections</h2>
        <p className="text-gray-600 text-sm mt-1">
          Quick links to useful language and reference sections you have starred in your resources.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded-lg p-5 border border-amber-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/student/assignment/${item.assignmentId}?section=${encodeURIComponent(item.sectionSlug)}`}
                className="flex-1 min-w-0"
              >
                <p className="text-lg font-semibold truncate" style={{ color: '#38438f' }}>
                  {item.resourceTitle}
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  {item.sectionLabel}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={removingId === item.id}
                className="shrink-0 text-amber-500 hover:text-amber-600 disabled:opacity-50"
                aria-label={`Remove ${item.sectionLabel} from saved sections`}
                title="Remove from saved sections"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
