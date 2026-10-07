'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  STUDENT_UPLOAD_LEVELS,
  STUDENT_UPLOAD_SKILLS,
  isStudentUploadedResource,
} from '@/lib/student-uploaded-resource'

export function UploadedPdfBadge({ content }: { content?: string | null }) {
  if (!isStudentUploadedResource(content)) return null
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#e8eaf6] text-[#38438f]">
      Uploaded PDF
    </span>
  )
}

export default function UploadStudentDocument({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('')
  const [skill, setSkill] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!title.trim() || !level || !skill || !file) {
      setError('Enter a title, choose a level and category, and choose a PDF.')
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.set('enrollmentId', enrollmentId)
      body.set('title', title.trim())
      body.set('level', level)
      body.set('skill', skill)
      body.set('file', file)

      const response = await fetch('/api/student-resource-uploads', {
        method: 'POST',
        body,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to upload the document.' }))
        setError(data.error || 'Failed to upload the document.')
        return
      }

      setTitle('')
      setLevel('')
      setSkill('')
      setFile(null)
      setFileInputKey((key) => key + 1)
      router.refresh()
    } catch (uploadError) {
      console.error('Error uploading student document:', uploadError)
      setError('Failed to upload the document. Check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-1 text-gray-900">Upload a document</h3>
      <p className="text-sm text-gray-600 mb-4">
        Add a PDF for this student. It appears in their resource list with the title, level, and category you choose.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor={`upload-title-${enrollmentId}`} className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id={`upload-title-${enrollmentId}`}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none"
            onFocus={(event) => (event.currentTarget.style.borderColor = '#38438f')}
            onBlur={(event) => (event.currentTarget.style.borderColor = '#d1d5db')}
          />
        </div>
        <div>
          <label htmlFor={`upload-level-${enrollmentId}`} className="block text-sm font-medium text-gray-700 mb-2">
            Level
          </label>
          <select
            id={`upload-level-${enrollmentId}`}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none"
            onFocus={(event) => (event.currentTarget.style.borderColor = '#38438f')}
            onBlur={(event) => (event.currentTarget.style.borderColor = '#d1d5db')}
          >
            <option value="">Select level</option>
            {STUDENT_UPLOAD_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`upload-skill-${enrollmentId}`} className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id={`upload-skill-${enrollmentId}`}
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none"
            onFocus={(event) => (event.currentTarget.style.borderColor = '#38438f')}
            onBlur={(event) => (event.currentTarget.style.borderColor = '#d1d5db')}
          >
            <option value="">Select category</option>
            {STUDENT_UPLOAD_SKILLS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor={`upload-file-${enrollmentId}`} className="block text-sm font-medium text-gray-700 mb-2">
            PDF
          </label>
          <input
            key={fileInputKey}
            id={`upload-file-${enrollmentId}`}
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#e8eaf6] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#38438f]"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={uploading}
        className="mt-4 px-6 py-2 text-white rounded-md disabled:opacity-50 transition-colors hover:bg-[#2d3569]"
        style={{ backgroundColor: '#38438f' }}
      >
        {uploading ? 'Uploading...' : 'Upload document'}
      </button>
    </form>
  )
}
