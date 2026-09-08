'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { XavierResource } from '@/lib/french-xavier-resources'

export default function FrenchXavierResourcesManager() {
  const [resources, setResources] = useState<XavierResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadResources = useCallback(async () => {
    setError(null)
    const response = await fetch('/api/french/xavier-resources')
    const data = await response.json().catch(() => [])

    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to load resources')
      return
    }

    setResources(data as XavierResource[])
  }, [])

  useEffect(() => {
    loadResources().finally(() => setLoading(false))
  }, [loadResources])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !file) return

    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('file', file)

      const response = await fetch('/api/french/xavier-resources', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to add resource')
        return
      }

      setResources((current) => [data as XavierResource, ...current])
      resetForm()
      setShowForm(false)
    } catch {
      setError('Failed to add resource')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (resource: XavierResource) => {
    if (!confirm(`Delete “${resource.title}”?`)) return

    setDeletingId(resource.id)
    setError(null)

    try {
      const response = await fetch(`/api/french/xavier-resources/${resource.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to delete resource')
        return
      }

      setResources((current) => current.filter((item) => item.id !== resource.id))
    } catch {
      setError('Failed to delete resource')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          PDFs from your Adomlingua work with Xavier. Open any file to revise or print.
        </p>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: '#38438f' }}
        >
          {showForm ? 'Cancel' : 'Add resource'}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Add a Xavier PDF</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="e.g. Concordance des temps — worksheet 2"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Description <span className="font-normal text-gray-500">(optional)</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="A short note to help you find it later…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">PDF</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                required
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setFile(nextFile)
                  if (nextFile && !title.trim()) {
                    setTitle(nextFile.name.replace(/\.[^/.]+$/, ''))
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
              />
              {file ? (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              ) : null}
            </label>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={saving || !title.trim() || !file}
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: '#38438f' }}
            >
              {saving ? 'Uploading…' : 'Save resource'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Loading resources…</p>
      ) : resources.length === 0 ? (
        <p className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-gray-600">
          No PDFs yet. Click Add resource to upload your first one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-amber-950">{resource.title}</h2>
              {resource.description ? (
                <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
              ) : null}
              <div className="mt-3 flex items-center gap-4">
                <a
                  href={resource.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#38438f] hover:underline"
                >
                  Open PDF →
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(resource)}
                  disabled={deletingId === resource.id}
                  className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50"
                >
                  {deletingId === resource.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
