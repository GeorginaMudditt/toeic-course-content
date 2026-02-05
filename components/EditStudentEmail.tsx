'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EditStudentEmailProps {
  studentId: string
  currentEmail: string
}

export default function EditStudentEmail({ studentId, currentEmail }: EditStudentEmailProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [email, setEmail] = useState(currentEmail)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  // Reset email when modal opens/closes
  useEffect(() => {
    if (showEdit) {
      setEmail(currentEmail)
      setError('')
    }
  }, [showEdit, currentEmail])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showEdit) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (email.toLowerCase().trim() === currentEmail.toLowerCase().trim()) {
      setError('Email is the same as current email')
      return
    }

    setUpdating(true)

    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        // Close modal and refresh page
        setShowEdit(false)
        router.refresh()
      } else {
        setError(data.error || 'Failed to update email')
        setUpdating(false)
      }
    } catch (error: any) {
      console.error('Error updating email:', error)
      setError(error.message || 'Failed to update email. Please try again.')
      setUpdating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="px-4 py-2 text-white rounded-md transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#38438f' }}
      >
        Edit Email
      </button>

      {showEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !updating && setShowEdit(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
              {/* Close button */}
              {!updating && (
                <button
                  onClick={() => setShowEdit(false)}
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
                {/* Title */}
                <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">
                  Change Email Address
                </h3>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={updating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38438f] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Current email: <span className="font-medium">{currentEmail}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEdit(false)}
                      disabled={updating}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-4 py-2 text-white rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#38438f' }}
                    >
                      {updating ? 'Updating...' : 'Update Email'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
