'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Document {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
  createdAt: string
}

interface Props {
  studentId: string
  documents: Document[]
}

export default function StudentDocumentManager({ studentId, documents: initialDocuments }: Props) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentTitle, setDocumentTitle] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title with filename (without extension) if title is empty
      if (!documentTitle) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setDocumentTitle(nameWithoutExt)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file')
      return
    }

    if (!documentTitle.trim()) {
      alert('Please enter a document title')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('studentId', studentId)
      formData.append('title', documentTitle.trim())

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments([data.document, ...documents])
        setSelectedFile(null)
        setDocumentTitle('')
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload document' }))
        alert(errorData.error || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== documentId))
        router.refresh()
      } else {
        alert('Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Upload Document</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g., Signed Contract, Terms and Conditions"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File (PDF, PNG, JPEG - max 10MB)
            </label>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !documentTitle.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Assigned Documents</h3>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No documents have been uploaded yet.</p>
            <p className="text-sm text-gray-400 mt-1">Upload a document above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {document.mimeType === 'application/pdf' ? (
                      <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{document.title}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {document.fileName}
                      {document.fileSize && (
                        <span className="ml-2">• {(document.fileSize / 1024).toFixed(1)} KB</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded {new Date(document.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(document.id)}
                  className="ml-4 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
