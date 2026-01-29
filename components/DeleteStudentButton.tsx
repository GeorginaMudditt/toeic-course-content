'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { brizzleRed, brizzleRedHover, brizzleRedLight } from '@/lib/brand-colors'

interface DeleteStudentButtonProps {
  studentId: string
  studentName: string
}

export default function DeleteStudentButton({ studentId, studentName }: DeleteStudentButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showConfirm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showConfirm])

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to students list after successful deletion
        router.push('/teacher/students')
        router.refresh()
      } else {
        setError(data.error || 'Failed to delete student')
        setDeleting(false)
      }
    } catch (error: any) {
      console.error('Error deleting student:', error)
      setError(error.message || 'Failed to delete student. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 text-white rounded-md transition-colors"
        style={{ backgroundColor: brizzleRed }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brizzleRedHover}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brizzleRed}
      >
        Delete Student
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !deleting && setShowConfirm(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
              {/* Close button */}
              {!deleting && (
                <button
                  onClick={() => setShowConfirm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${brizzleRed}20` }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke={brizzleRed} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
                  Are you sure?
                </h3>

                {/* Message */}
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                  Are you sure you want to delete <strong>{studentName}</strong>?<br />
                  This action cannot be undone. All enrollments, assignments, and progress will be permanently deleted.
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: brizzleRedLight, border: `1px solid ${brizzleRed}40` }}>
                    <p className="text-sm" style={{ color: brizzleRed }}>{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: brizzleRed }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = brizzleRedHover)}
                    onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = brizzleRed)}
                  >
                    {deleting ? 'Deleting...' : 'Delete Student'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
