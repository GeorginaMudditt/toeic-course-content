'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface UploadedFile {
  path: string
  filename: string
  type: string
  isAudio?: boolean
  isPDF?: boolean
  isImage?: boolean
  audioCode?: string
}

export default function NewResourcePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [contentType, setContentType] = useState<'html' | 'file'>('html')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    level: '',
    tags: ''
  })

  // Extract audio code from filename (e.g., "A1.mp3" or "A1.mp4" -> "A1")
  const extractAudioCode = (filename: string): string | null => {
    const match = filename.match(/^([A-Z0-9]+)\.(mp3|mp4)$/i)
    return match ? match[1].toUpperCase() : null
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      files.forEach(file => {
        uploadFormData.append('files', file)
      })

      const response = await fetch('/api/resources/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (response.ok) {
        const data = await response.json()
        // Handle both single file (backward compatibility) and multiple files
        const filesData = data.files || [data]
        
        const processedFiles: UploadedFile[] = filesData.map((file: any) => ({
          path: file.path,
          filename: file.filename,
          type: file.type,
          isAudio: file.isAudio,
          isPDF: file.isPDF,
          isImage: file.isImage,
            audioCode: file.isAudio ? extractAudioCode(file.filename) : undefined
        }))

        setUploadedFiles(processedFiles)

        // Organize files: PDF + audio files
        const pdfFile = processedFiles.find(f => f.isPDF)
        const audioFiles = processedFiles.filter(f => f.isAudio)

        if (pdfFile && audioFiles.length > 0) {
          // Store as JSON for PDF with audio
          const contentData = {
            type: 'pdf-with-audio',
            pdf: pdfFile.path,
            audio: audioFiles.map(f => ({
              path: f.path,
              code: f.audioCode || f.filename.replace(/\.(mp3|mp4)$/i, '').toUpperCase(),
              filename: f.filename
            }))
          }
          setFormData({ ...formData, content: JSON.stringify(contentData) })
        } else if (pdfFile) {
          // Just PDF
          setFormData({ ...formData, content: pdfFile.path })
        } else if (processedFiles.length === 1 && processedFiles[0].isImage) {
          // Just image
          setFormData({ ...formData, content: processedFiles[0].path })
        } else {
          // HTML or other
          setFormData({ ...formData, content: '' })
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload files')
        e.target.value = ''
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Failed to upload files')
      e.target.value = ''
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // If using file upload, content should be the file path or JSON
      const content = contentType === 'file' && uploadedFiles.length > 0
        ? (formData.content.startsWith('{') ? formData.content : uploadedFiles[0].path)
        : formData.content

      if (!content) {
        alert('Please provide either HTML content or upload a file')
        setLoading(false)
        return
      }

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content,
          type: 'WORKSHEET', // All resources are worksheets
          estimatedHours: 1, // All resources are 1 hour
          level: formData.level
        })
      })

      if (response.ok) {
        router.push('/teacher/resources')
      } else {
        alert('Failed to create resource')
      }
    } catch (error) {
      console.error('Error creating resource:', error)
      alert('Failed to create resource')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Resource</h1>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                  Level *
                </label>
                <select
                  id="level"
                  required
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                >
                  <option value="">Select level...</option>
                  <option value="All">All</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="listening, reading, grammar"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              
              {/* Content Type Selection */}
              <div className="mb-4 flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contentType"
                    value="html"
                    checked={contentType === 'html'}
                    onChange={(e) => {
                      setContentType('html')
                      setUploadedFile(null)
                      setFormData({ ...formData, content: '' })
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">HTML Content</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contentType"
                    value="file"
                    checked={contentType === 'file'}
                    onChange={(e) => {
                      setContentType('file')
                      setFormData({ ...formData, content: '' })
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Upload PDF/Image</span>
                </label>
              </div>

              {contentType === 'html' ? (
                <>
                  <p className="text-sm text-gray-500 mb-2">
                    Enter the worksheet content in HTML format. You can include questions, instructions, etc.
                  </p>
                  <textarea
                    id="content"
                    required={contentType === 'html'}
                    rows={15}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    placeholder='<h2>Worksheet Title</h2><p>Instructions...</p><ol><li>Question 1</li><li>Question 2</li></ol>'
                  />
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload files: PDF (required) and MP4 audio files (optional). 
                    <br />
                    <span className="font-medium">For audio files:</span> Name them with audio codes (e.g., A1.mp4, A2.mp4) to match icons on your PDF.
                    <br />
                    Max sizes: PDF/Images 10MB, Audio 20MB
                  </p>
                  <input
                    type="file"
                    id="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.mp4,.mp3"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#38438f] file:text-white hover:file:bg-[#2d3569] disabled:opacity-50"
                  />
                  {uploading && (
                    <p className="mt-2 text-sm text-gray-600">Uploading...</p>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-md border ${
                            file.isPDF 
                              ? 'bg-blue-50 border-blue-200' 
                              : file.isAudio 
                              ? 'bg-purple-50 border-purple-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <p className="text-sm font-medium">
                            {file.isPDF && '📄 PDF: '}
                            {file.isAudio && '🎵 Audio: '}
                            {file.isImage && '🖼️ Image: '}
                            <strong>{file.filename}</strong>
                            {file.audioCode && (
                              <span className="ml-2 text-xs bg-purple-200 px-2 py-1 rounded">
                                Code: {file.audioCode}
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                      {uploadedFiles.some(f => f.isPDF) && uploadedFiles.some(f => f.isAudio) && (
                        <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded-md">
                          <p className="text-xs text-blue-800">
                            ✓ PDF and audio files will be linked together. Students will see the PDF with audio players below.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
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
                {loading ? 'Creating...' : 'Create Resource'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

