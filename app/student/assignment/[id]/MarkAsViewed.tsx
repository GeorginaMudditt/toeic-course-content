'use client'

import { useEffect } from 'react'

interface Props {
  assignmentId: string
}

export default function MarkAsViewed({ assignmentId }: Props) {
  useEffect(() => {
    // Record each visit — API only creates or bumps updatedAt; never overwrites saved work.
    fetch(`/api/progress/${assignmentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markViewedOnly: true,
        status: 'NOT_STARTED',
      }),
    }).catch((err) => {
      console.log('Could not mark assignment as viewed:', err)
    })
  }, [assignmentId])

  return null
}
