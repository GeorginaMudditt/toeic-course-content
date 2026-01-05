'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to change password')
        setLoading(false)
        return
      }

      setSuccess('Password changed successfully!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/student/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to change your password.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ color: '#38438f' }}>
              Change Password
            </h1>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    required
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    required
                    minLength={6}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#38438f]"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: '#38438f' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#2d3569')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#38438f')}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
