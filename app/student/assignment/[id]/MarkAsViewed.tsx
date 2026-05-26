'use client'

import { useEffect } from 'react'

interface Props {
  assignmentId: string
  hasProgress: boolean
}

export default function MarkAsViewed({ assignmentId, hasProgress }: Props) {
  useEffect(() => {
    // Create a NOT_STARTED progress record if one doesn't exist — never send empty notes
    // on update, so a slow request cannot wipe saved writing after the student has worked.
    if (!hasProgress) {
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
    }
  }, [assignmentId, hasProgress])

  return null
}
