'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function FamilyVocabularyNavbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeChildName = session?.user?.activeChildName
  const isVocabulary = pathname.startsWith('/student/vocabulary')

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/student/vocabulary" className="flex items-center space-x-3">
              <img
                src="/brizzle-logo.png"
                alt="Brizzle Logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="text-xl font-bold" style={{ color: '#38438f' }}>
                Brizzle
              </span>
            </Link>
            {mounted && (
              <Link
                href="/student/vocabulary"
                className={`hidden sm:inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isVocabulary
                    ? 'text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                }`}
                style={isVocabulary ? { borderColor: '#38438f' } : {}}
              >
                Vocabulary
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {mounted && activeChildName && (
              <span className="hidden md:inline text-sm text-gray-600">
                Learning as <strong className="text-gray-900">{activeChildName}</strong>
              </span>
            )}
            <Link
              href="/family"
              className="text-sm font-medium px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Switch learner
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm font-medium px-3 py-2 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#38438f' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
