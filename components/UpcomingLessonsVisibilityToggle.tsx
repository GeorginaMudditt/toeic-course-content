'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  studentId: string
  hidden: boolean
}

export default function UpcomingLessonsVisibilityToggle({ studentId, hidden }: Props) {
  const router = useRouter()
  const [isHidden, setIsHidden] = useState(hidden)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = async (nextHidden: boolean) => {
    setError(null)
    setSaving(true)
    setIsHidden(nextHidden)
    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upcomingLessonsHidden: nextHidden }),
      })
      if (!response.ok) {
        setIsHidden(!nextHidden)
        setError('Could not update upcoming lessons. Try again.')
      } else {
        router.refresh()
      }
    } catch {
      setIsHidden(!nextHidden)
      setError('Could not update upcoming lessons. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3">
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-[#38438f] focus:ring-[#38438f]"
          checked={isHidden}
          disabled={saving}
          onChange={(event) => void onChange(event.target.checked)}
        />
        Hide upcoming lessons on this student&apos;s dashboard
      </label>
      <p className="mt-1 text-sm text-gray-500">
        Course hours stay visible. Use this when lessons are not booked with a code.
      </p>
      {error && (
        <p className="mt-1 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
