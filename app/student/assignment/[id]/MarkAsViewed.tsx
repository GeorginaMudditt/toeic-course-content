'use client'

import { useEffect } from 'react'

interface Props {
  assignmentId: string
  hasProgress: boolean
}

export default function MarkAsViewed({ assignmentId, hasProgress }: Props) {
  useEffect(() => {
    // Create a NOT_STARTED progress record if one doesn't exist
    // This marks the assignment as "viewed" so the NEW badge disappears
    if (!hasProgress) {
      fetch(`/api/progress/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: '',
          status: 'NOT_STARTED'
        })
      }).catch(err => {
        // Silently fail - this is not critical
        console.log('Could not mark assignment as viewed:', err)
      })
    }
  }, [assignmentId, hasProgress])

  return null
}
