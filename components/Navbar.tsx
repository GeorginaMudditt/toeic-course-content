'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isTeacher = session?.user?.role === 'TEACHER'

  const isActive = (path: string) => {
    if (path === '/teacher/dashboard' || path === '/student/dashboard') {
      return pathname === path
    }
    if (path === '/student/toeic-info' || path === '/student/vocabulary' || path === '/student/course') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

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
              <div className="flex items-center mr-4">
                {(() => {
                  const name = session.user.name
                  const isDemoStudent = name.toLowerCase().includes('demo')
                  const initials = isDemoStudent 
                    ? 'DS' 
                    : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white mr-2"
                      style={{ backgroundColor: '#38438f' }}
                      title={name}
                    >
                      {initials}
                    </div>
                  )
                })()}
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

