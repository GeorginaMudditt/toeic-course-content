'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (session?.user) {
      if (session.user.role === 'TEACHER') {
        router.push('/teacher/dashboard')
      } else if (session.user.role === 'STUDENT') {
        router.push('/student/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
