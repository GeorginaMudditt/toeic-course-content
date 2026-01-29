'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import AvatarSelector from './AvatarSelector'

export default function Navbar() {
  const { data: session, update: updateSession } = useSession()
  const pathname = usePathname()
  const isTeacher = session?.user?.role === 'TEACHER'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    if (path === '/teacher/dashboard' || path === '/student/dashboard') {
      return pathname === path
    }
    if (path === '/student/toeic-info' || path === '/student/vocabulary' || path === '/student/course') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3">
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
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isTeacher ? (
                <>
                  <Link
                    href="/teacher/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/teacher/dashboard')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/teacher/dashboard') ? { borderColor: '#38438f' } : {}}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/teacher/resources"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/teacher/resources')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/teacher/resources') ? { borderColor: '#38438f' } : {}}
                  >
                    Resources
                  </Link>
                  <Link
                    href="/teacher/students"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/teacher/students')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/teacher/students') ? { borderColor: '#38438f' } : {}}
                  >
                    Students
                  </Link>
                  <Link
                    href="/teacher/progress"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/teacher/progress')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/teacher/progress') ? { borderColor: '#38438f' } : {}}
                  >
                    Progress
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/student/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/student/dashboard')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/student/dashboard') ? { borderColor: '#38438f' } : {}}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/student/toeic-info"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/student/toeic-info')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/student/toeic-info') ? { borderColor: '#38438f' } : {}}
                  >
                    About
                  </Link>
                  <Link
                    href="/student/vocabulary"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/student/vocabulary')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/student/vocabulary') ? { borderColor: '#38438f' } : {}}
                  >
                    Vocabulary
                  </Link>
                  <Link
                    href="/student/course"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/student/course')
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-[#38438f] hover:border-[#38438f]'
                    }`}
                    style={isActive('/student/course') ? { borderColor: '#38438f' } : {}}
                  >
                    Course
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {session?.user?.name && (
              <div className="relative" ref={dropdownRef}>
                {(() => {
                  const name = session.user.name
                  const avatar = session.user.avatar
                  const isDemoStudent = name.toLowerCase().includes('demo')
                  const initials = isDemoStudent 
                    ? 'DS' 
                    : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  
                  // Check if avatar is an emoji (single character or short string) or an image URL
                  const isEmoji = avatar && /^[\p{Emoji}\s]+$/u.test(avatar) && avatar.length <= 10
                  const isImageUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))
                  
                  return (
                    <>
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#38438f' }}
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white overflow-hidden"
                          style={{ 
                            backgroundColor: isEmoji || isImageUrl ? 'transparent' : 'rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          {isImageUrl ? (
                            <img 
                              src={avatar} 
                              alt={name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.textContent = initials
                                  parent.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                                }
                              }}
                            />
                          ) : isEmoji ? (
                            <span className="text-lg">{avatar}</span>
                          ) : (
                            initials
                          )}
                        </div>
                        <span>Account</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false)
                                setShowAvatarSelector(true)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Edit Avatar
                            </button>
                            <Link
                              href={isTeacher ? '/teacher/change-password' : '/student/change-password'}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Change Password
                            </Link>
                            {/* View my Contract - only visible for students when contract URL is configured */}
                            {!isTeacher && process.env.NEXT_PUBLIC_STUDENT_CONTRACT_URL && (
                              <a
                                href={process.env.NEXT_PUBLIC_STUDENT_CONTRACT_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                                onClick={() => setIsDropdownOpen(false)}
                              >
                                View my Contract
                              </a>
                            )}
                            <a
                              href="mailto:hello@brizzle-english.com"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              Contact us
                            </a>
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false)
                                signOut()
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowAvatarSelector(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100 z-10"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <AvatarSelector
              currentAvatar={session?.user?.avatar || null}
              onAvatarChange={async (newAvatar) => {
                console.log('Updating session with avatar:', newAvatar)
                await updateSession({ 
                  avatar: newAvatar,
                  user: {
                    ...session?.user,
                    avatar: newAvatar
                  }
                })
                // Force a page refresh to ensure the session is updated
                window.location.reload()
              }}
              onClose={() => setShowAvatarSelector(false)}
            />
          </div>
        </div>
      )}
    </nav>
  )
}

