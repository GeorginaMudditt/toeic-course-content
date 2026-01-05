'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Email is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to process request')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'If an account with that email exists, a password reset link has been sent.')
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
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
            Reset your password
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
              <p className="mt-2 text-sm">
                Check your email for a password reset link. If you don't see it, check your spam folder.
              </p>
            </div>
          )}

          {!success && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38438f] sm:text-sm"
                  onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
