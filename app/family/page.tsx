'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

type FamilyChild = {
  id: string
  name: string
  avatar: string | null
  displayOrder: number
}

function childInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function FamilyPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [children, setChildren] = useState<FamilyChild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectingId, setSelectingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (session?.user?.role !== 'GUARDIAN') {
      router.replace('/dashboard-redirect')
      return
    }

    fetch('/api/family/children')
      .then((res) => res.json())
      .then((result) => {
        if (result.error) {
          setError(result.error)
          return
        }
        setChildren(result.data || [])
      })
      .catch(() => setError('Could not load learners'))
      .finally(() => setLoading(false))
  }, [status, session, router])

  const selectChild = async (child: FamilyChild) => {
    setSelectingId(child.id)
    setError('')
    try {
      const response = await fetch('/api/family/active-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childStudentId: child.id }),
      })
      const result = await response.json()
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Could not select learner')
      }

      await update({
        activeChildId: result.data.activeChildId,
        activeChildName: result.data.activeChildName,
      })

      router.push('/student/vocabulary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSelectingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center mb-8">
          <img src="/brizzle-logo.png" alt="Brizzle Logo" width={56} height={56} className="h-14 w-14 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 text-center">Who&apos;s learning today?</h1>
          <p className="text-gray-600 text-center mt-2">
            Choose a name to open vocabulary activities with their own progress board.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : children.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No learners are linked to this account yet. Please contact Brizzle.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {children.map((child) => {
              const isEmoji = child.avatar && /^[\p{Emoji}\s]+$/u.test(child.avatar) && child.avatar.length <= 10
              const isSelecting = selectingId === child.id
              return (
                <button
                  key={child.id}
                  type="button"
                  disabled={Boolean(selectingId)}
                  onClick={() => selectChild(child)}
                  className="bg-white border-2 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ borderColor: '#38438f' }}
                >
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-semibold text-white"
                    style={{ backgroundColor: '#38438f' }}
                  >
                    {isEmoji ? (
                      <span className="text-3xl">{child.avatar}</span>
                    ) : (
                      childInitials(child.name)
                    )}
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{child.name}</div>
                  <div className="text-sm text-gray-500 mt-2">
                    {isSelecting ? 'Opening...' : 'Tap to start'}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          {session?.user?.activeChildId && (
            <Link
              href="/student/vocabulary"
              className="text-[#38438f] font-medium hover:underline"
            >
              Continue as {session.user.activeChildName}
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
