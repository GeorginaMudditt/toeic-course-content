'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { WRITING_MAX_UPLOAD_BYTES } from '@/lib/writing-submissions'

type Props = {
  /** When set, form creates a submission on behalf of this student (teacher only). */
  studentId?: string
  onSubmitted?: () => void
  compact?: boolean
}

export default function WritingSubmissionForm({ studentId, onSubmitted, compact }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isTeacherUpload = Boolean(studentId)

  const resetForm = () => {
    setTitle('')
    setOriginalText('')
    setSelectedFile(null)
    const input = document.getElementById(
      isTeacherUpload ? `writing-file-${studentId}` : 'writing-file-student'
    ) as HTMLInputElement | null
    if (input) input.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!originalText.trim() && !selectedFile) {
      setError('Please type your writing and/or upload a file (PDF, PNG, or JPEG)')
      return
    }
    if (selectedFile && selectedFile.size > WRITING_MAX_UPLOAD_BYTES) {
      setError('File size exceeds limit (10MB)')
      return
    }

    setSubmitting(true)
    try {
      let filePath: string | null = null
      let fileName: string | null = null
      let mimeType: string | null = null
      let fileSize: number | null = null

      if (selectedFile) {
        const uploadUrlResponse = await fetch('/api/writing-submissions/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: studentId || undefined,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileSize: selectedFile.size,
          }),
        })

        if (!uploadUrlResponse.ok) {
          const errorData = await uploadUrlResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to prepare upload')
        }

        const uploadUrlData = await uploadUrlResponse.json()
        const { error: storageError } = await supabase.storage
          .from('resources')
          .uploadToSignedUrl(uploadUrlData.filePath, uploadUrlData.token, selectedFile)

        if (storageError) {
          throw new Error(storageError.message || 'Failed to upload file')
        }

        filePath = uploadUrlData.filePath
        fileName = selectedFile.name
        mimeType = selectedFile.type
        fileSize = selectedFile.size
      }

      const response = await fetch('/api/writing-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId || undefined,
          title: title.trim(),
          originalText: originalText.trim(),
          filePath,
          fileName,
          mimeType,
          fileSize,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit writing')
      }

      resetForm()
      setSuccess(
        isTeacherUpload
          ? 'Writing uploaded for the student. You can mark it from the list below.'
          : 'Writing submitted. Your teacher will mark it and you will see corrections here.'
      )
      onSubmitted?.()
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to submit writing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-white shadow rounded-lg ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#38438f' }}>
          {isTeacherUpload ? 'Upload writing on behalf of student' : 'Submit writing for marking'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {isTeacherUpload
            ? 'Use this when a student emails you their writing. Paste the text and/or upload their file.'
            : 'Type your writing below, or upload a PDF/image of handwritten work (or both).'}
        </p>
      </div>

      <div>
        <label htmlFor="writing-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="writing-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. TOEIC email practice – Lesson 4"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38438f]"
        />
      </div>

      <div>
        <label htmlFor="writing-text" className="block text-sm font-medium text-gray-700 mb-1">
          Writing text {isTeacherUpload ? '(optional if uploading a file)' : '(optional if uploading a file)'}
        </label>
        <textarea
          id="writing-text"
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          rows={compact ? 8 : 12}
          placeholder="Paste or type the writing here…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#38438f]"
        />
      </div>

      <div>
        <label
          htmlFor={isTeacherUpload ? `writing-file-${studentId}` : 'writing-file-student'}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          File upload (optional) — PDF, PNG, or JPEG, max 10MB
        </label>
        <input
          id={isTeacherUpload ? `writing-file-${studentId}` : 'writing-file-student'}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/jpg"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#38438f] file:text-white hover:file:opacity-90"
        />
        {selectedFile && (
          <p className="text-xs text-gray-500 mt-1">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700" role="status">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-[#38438f] text-white rounded-md hover:opacity-90 disabled:opacity-50 text-sm font-medium"
      >
        {submitting ? 'Submitting…' : isTeacherUpload ? 'Upload for student' : 'Submit for marking'}
      </button>
    </form>
  )
}
