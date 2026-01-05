'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        setLoading(false)
        return
      }

      setSuccess('Password has been reset successfully! Redirecting to login...')
      setFormData({
        newPassword: '',
        confirmPassword: ''
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-4">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="text-[#38438f] hover:underline"
            >
              Request a new password reset
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <img
              src="/brizzle-logo.png"
              alt="Brizzle Logo"
              width={140}
              height={140}
              className="mx-auto"
            />
          </div>
          <h1 className="text-4xl font-extrabold" style={{ color: '#38438f' }}>
            Brizzle TOEIC®
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set your new password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {!success && (
            <>
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
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38438f] sm:text-sm"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    placeholder="Enter new password"
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
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38438f] sm:text-sm"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    placeholder="Confirm new password"
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

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  style={{ backgroundColor: '#38438f' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3569'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38438f'}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-[#38438f] hover:underline"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
