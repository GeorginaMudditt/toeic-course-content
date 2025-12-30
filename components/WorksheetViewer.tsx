'use client'

import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface Resource {
  id: string
  title: string
  content: string
  type: string
}

interface Progress {
  id?: string
  status: string
  notes?: string | null
}

interface WorksheetViewerProps {
  assignmentId: string
  resource: Resource
  initialProgress?: Progress | null
}

export default function WorksheetViewer({ assignmentId, resource, initialProgress }: WorksheetViewerProps) {
  const [notes, setNotes] = useState(initialProgress?.notes || '')
  const [status, setStatus] = useState(initialProgress?.status || 'NOT_STARTED')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Auto-save every 30 seconds
    const autoSave = setInterval(() => {
      if (notes && status !== 'NOT_STARTED') {
        saveProgress()
      }
    }, 30000)

    return () => clearInterval(autoSave)
  }, [notes, status])

  const saveProgress = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/progress/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          status: status === 'NOT_STARTED' ? 'IN_PROGRESS' : status
        })
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        if (status === 'NOT_STARTED') {
          setStatus('IN_PROGRESS')
        }
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    } finally {
      setSaving(false)
    }
  }

  const markComplete = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/progress/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          status: 'COMPLETED'
        })
      })

      if (response.ok) {
        setStatus('COMPLETED')
        setSaved(true)
      }
    } catch (error) {
      console.error('Failed to mark complete:', error)
    } finally {
      setSaving(false)
    }
  }

  const downloadPDF = async () => {
    const element = document.getElementById('worksheet-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${resource.title}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={saveProgress}
            disabled={saving}
            className="px-4 py-2 text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: '#38438f' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#2d3569')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#38438f')}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Progress'}
          </button>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Download PDF
          </button>
        </div>
        {status === 'COMPLETED' && (
          <span className="text-green-600 font-medium">✓ Completed</span>
        )}
      </div>

      <div id="worksheet-content" className="border rounded-lg p-6 bg-white mb-4">
        {resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/') ? (
          // File-based content (PDF or Image)
          (() => {
            const filePath = resource.content.startsWith('/') ? resource.content : `/${resource.content}`
            const isPDF = filePath.toLowerCase().endsWith('.pdf')
            const isImage = /\.(png|jpg|jpeg)$/i.test(filePath)
            
            if (isPDF) {
              return (
                <iframe
                  src={filePath}
                  className="w-full h-[800px] border-0"
                  title={resource.title}
                />
              )
            } else if (isImage) {
              return (
                <img
                  src={filePath}
                  alt={resource.title}
                  className="max-w-full h-auto mx-auto"
                />
              )
            } else {
              return <p className="text-gray-500">Unsupported file type</p>
            }
          })()
        ) : (
          // HTML content
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: resource.content }}
          />
        )}
      </div>

      <div className="mt-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Your Work / Answers
        </label>
        <textarea
          id="notes"
          rows={10}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
          onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          placeholder="Type your answers or work here..."
        />
      </div>

      {status !== 'COMPLETED' && (
        <div className="mt-4">
          <button
            onClick={markComplete}
            className="px-6 py-2 text-white rounded-md"
            style={{ backgroundColor: '#38438f' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3569'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38438f'}
          >
            Mark as Complete
          </button>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>⚠️ This worksheet is unique to you. Do not share the link with anyone.</p>
        <p>Your progress is automatically saved every 30 seconds.</p>
      </div>
    </div>
  )
}

