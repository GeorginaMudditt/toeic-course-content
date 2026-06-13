'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface QualiopiFile {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  createdAt: string
}

interface Props {
  indicatorSlug: string
  folderSlug: string
  files: QualiopiFile[]
}

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export default function QualiopiFileManager({
  indicatorSlug,
  folderSlug,
  files: initialFiles,
}: Props) {
  const router = useRouter()
  const [files, setFiles] = useState<QualiopiFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed.')
      e.target.value = ''
      return
    }

    setSelectedFile(file)
    if (!documentTitle) {
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file')
      return
    }

    if (!documentTitle.trim()) {
      alert('Please enter a document title')
      return
    }

    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      alert('File size exceeds limit (25MB)')
      return
    }

    setUploading(true)
    try {
      const uploadUrlResponse = await fetch('/api/qualiopi/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicatorSlug,
          folderSlug,
          fileName: selectedFile.name,
          mimeType: 'application/pdf',
          fileSize: selectedFile.size,
        }),
      })

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json().catch(() => ({ error: 'Failed to prepare upload' }))
        alert(errorData.error || 'Failed to prepare upload')
        return
      }

      const uploadUrlData = await uploadUrlResponse.json()
      const filePath = uploadUrlData.filePath as string
      const token = uploadUrlData.token as string

      const { error: storageError } = await supabase.storage
        .from('resources')
        .uploadToSignedUrl(filePath, token, selectedFile)

      if (storageError) {
        console.error('Error uploading Qualiopi file to storage:', storageError)
        alert(storageError.message || 'Failed to upload file to storage')
        return
      }

      const response = await fetch('/api/qualiopi/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicatorSlug,
          folderSlug,
          title: documentTitle.trim(),
          fileName: selectedFile.name,
          filePath,
          fileSize: selectedFile.size,
          mimeType: 'application/pdf',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save file record' }))
        alert(errorData.error || 'Failed to save file record')
        return
      }

      const data = await response.json()
      setFiles([data.file, ...files])
      setSelectedFile(null)
      setDocumentTitle('')
      const fileInput = document.getElementById('qualiopi-file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      router.refresh()
    } catch (error) {
      console.error('Error uploading Qualiopi file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      const response = await fetch(`/api/qualiopi/files/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFiles(files.filter((file) => file.id !== fileId))
        router.refresh()
      } else {
        alert('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting Qualiopi file:', error)
      alert('Failed to delete file')
    }
  }

  const handleView = (fileUrl: string) => {
    if (!fileUrl) {
      alert('File link is missing')
      return
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Upload PDF</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document title
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g., CELTA completion certificate"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF file (max 25MB)
            </label>
            <input
              id="qualiopi-file-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !documentTitle.trim()}
            className="px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#2d3569]"
            style={{ backgroundColor: '#38438f' }}
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Uploaded files</h3>
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No PDFs uploaded yet.</p>
            <p className="text-sm text-gray-400 mt-1">Upload a completion certificate above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <svg className="w-8 h-8 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{file.title}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {file.fileName}
                      {file.fileSize && (
                        <span className="ml-2">• {(file.fileSize / 1024).toFixed(1)} KB</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded{' '}
                      {new Date(file.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleView(file.fileUrl)}
                    className="text-sm transition-colors hover:text-[#2d3569]"
                    style={{ color: '#38438f' }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
