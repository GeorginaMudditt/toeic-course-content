'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
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

// Inline answer input component for placement test
function InlineAnswerInput({ 
  answerPath, 
  value, 
  onChange, 
  type = 'radio',
  assignmentId,
  onFileUpload
}: { 
  answerPath: string
  value: string
  onChange: (value: string) => void
  type?: 'radio' | 'text' | 'textarea' | 'fileUpload'
  assignmentId?: string
  onFileUpload?: (fileUrl: string) => void
}) {
  if (type === 'radio') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {['A', 'B', 'C', 'D'].map((option) => (
          <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input
              type="radio"
              name={answerPath}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px' }}>{option}</span>
          </label>
        ))}
      </div>
    )
  } else if (type === 'text') {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '13px',
          width: '120px',
          marginLeft: '8px'
        }}
        placeholder="Answer"
      />
    )
  } else if (type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          minHeight: '150px',
          resize: 'vertical'
        }}
        placeholder="Type your written response here..."
      />
    )
  } else if (type === 'fileUpload' && assignmentId && onFileUpload) {
    // File upload component - simplified without local state
    const FileUploadComponent = () => {
      const [uploading, setUploading] = useState(false)
      
      const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const isImage = file.type.startsWith('image/')
        const isPDF = file.type === 'application/pdf'
        
        if (!isImage && !isPDF) {
          alert('Please upload a JPG, PNG, or PDF file.')
          e.target.value = ''
          return
        }

        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          alert('File size exceeds 10MB limit. Please choose a smaller file.')
          e.target.value = ''
          return
        }

        setUploading(true)
        try {
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch(`/api/assignments/${assignmentId}/upload`, {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const data = await response.json()
            const fileUrl = data.path || data.url || (data.files && data.files[0]?.path)
            
            if (fileUrl) {
              onFileUpload(fileUrl)
            } else {
              throw new Error('No file URL returned')
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
            alert(errorData.error || 'Failed to upload file. Please try again.')
          }
        } catch (error) {
          console.error('Error uploading file:', error)
          alert('Failed to upload file. Please try again.')
        } finally {
          setUploading(false)
          e.target.value = ''
        }
      }

      if (value) {
        // Extract filename from URL
        const urlParts = value.split('/')
        const filename = urlParts[urlParts.length - 1]
        
        return (
          <div style={{ marginTop: '10px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                ✓ File uploaded: <strong>{filename}</strong>
              </p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#38438f', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
              >
                View uploaded file →
              </a>
              <button
                onClick={() => {
                  onChange('')
                  onFileUpload('')
                }}
                style={{ fontSize: '13px', color: '#dc2626', marginTop: '8px', display: 'block', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Remove file
              </button>
            </div>
          </div>
        )
      }

      return (
        <div style={{ marginTop: '10px' }}>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{
              fontSize: '13px',
              padding: '4px'
            }}
          />
          {uploading && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', margin: 0 }}>Uploading file... Please wait.</p>
          )}
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', margin: 0 }}>Accepted formats: JPG, PNG, PDF (max 10MB)</p>
        </div>
      )
    }
    
    return <FileUploadComponent />
  }
  
  return null
}

export default function WorksheetViewer({ assignmentId, resource, initialProgress }: WorksheetViewerProps) {
  const [notes, setNotes] = useState(initialProgress?.notes || '')
  const [status, setStatus] = useState(initialProgress?.status || 'NOT_STARTED')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Check if this is a Placement Test
  const isPlacementTest = resource.title.toLowerCase().includes('placement test')
  
  // Parse placement test answers from notes
  const getPlacementTestAnswers = () => {
    if (!isPlacementTest || !notes) return {}
    try {
      return JSON.parse(notes)
    } catch {
      return {}
    }
  }
  
  const placementTestAnswers = getPlacementTestAnswers()
  
  // Update placement test answer - use useCallback to stabilize the reference
  const updatePlacementTestAnswer = useCallback((path: string, value: string) => {
    const currentAnswers = placementTestAnswers || {}
    const newAnswers = JSON.parse(JSON.stringify(currentAnswers))
    
    // Initialize structure if needed
    if (!newAnswers.listening) newAnswers.listening = { photographs: {}, conversations: {} }
    if (!newAnswers.reading) newAnswers.reading = { incompleteSentences: {}, readingComprehension: {} }
    if (!newAnswers.speaking) newAnswers.speaking = { readAloud: '', expressOpinion: '' }
    if (!newAnswers.writing) newAnswers.writing = ''
    if (!newAnswers.writingFileUrl) newAnswers.writingFileUrl = undefined
    
    // Handle direct writing and writingFileUrl paths
    if (path === 'writing') {
      newAnswers.writing = value
    } else if (path === 'writingFileUrl') {
      newAnswers.writingFileUrl = value || undefined
    } else {
      // Handle nested paths
      const keys = path.split('.')
      let current: any = newAnswers
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
    }
    
    const newNotes = JSON.stringify(newAnswers, null, 2)
    setNotes(newNotes)
    // Auto-save will be handled by the auto-save effect
  }, [placementTestAnswers])
  
  const saveProgress = async (notesToSave?: string) => {
    const notesValue = notesToSave || notes
    setSaving(true)
    try {
      const response = await fetch(`/api/progress/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesValue,
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
  
  // Auto-save placement test answers when notes change
  useEffect(() => {
    if (isPlacementTest && notes) {
      const timeoutId = setTimeout(() => {
        saveProgress(notes)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [notes, isPlacementTest])
  
  // Inject inline answer inputs into HTML content
  useEffect(() => {
    if (!isPlacementTest || !contentRef.current) return
    
    // Use MutationObserver to wait for HTML content to be inserted
    const observer = new MutationObserver(() => {
      if (!contentRef.current) return
      
      // Look for answer inputs in the entire contentRef, including nested divs
      const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
      console.log('Found answer input placeholders:', answerInputs.length)
      
      if (answerInputs.length === 0) {
        // Try again after a short delay - HTML might still be rendering
        return
      }
      
      // Disconnect observer once we find the elements
      observer.disconnect()
      
      const roots: Array<{ container: Element; root: any }> = []
      
      answerInputs.forEach((container) => {
        const answerPath = container.getAttribute('data-answer-input')
        if (!answerPath) return
        
        // Get current value
        let currentValue = ''
        if (answerPath === 'writing') {
          currentValue = placementTestAnswers?.writing || ''
        } else if (answerPath === 'writingFileUpload') {
          currentValue = placementTestAnswers?.writingFileUrl || ''
        } else {
          const keys = answerPath.split('.')
          let current: any = placementTestAnswers
          for (const key of keys) {
            current = current?.[key]
          }
          currentValue = current || ''
        }
        
        // Determine input type
        let inputType: 'radio' | 'text' | 'textarea' | 'fileUpload' = 'radio'
        if (answerPath === 'writing') {
          inputType = 'textarea'
        } else if (answerPath === 'writingFileUpload') {
          inputType = 'fileUpload'
        } else if (answerPath.includes('incompleteSentences')) {
          inputType = 'text'
        }
        
        // Create React root and render component
        try {
          // Clear the container first
          container.innerHTML = ''
          const root = createRoot(container as HTMLElement)
          root.render(
            <InlineAnswerInput
              answerPath={answerPath}
              value={currentValue}
              onChange={(value) => updatePlacementTestAnswer(answerPath, value)}
              type={inputType}
              assignmentId={assignmentId}
              onFileUpload={(fileUrl) => updatePlacementTestAnswer('writingFileUrl', fileUrl)}
            />
          )
          roots.push({ container, root })
          console.log('Rendered answer input for:', answerPath)
        } catch (error) {
          console.error('Error rendering inline answer input:', error, answerPath)
        }
      })
      
      // Store roots for cleanup
      roots.forEach(({ container, root }) => {
        (container as any)._reactRoot = root
      })
    })
    
    // Start observing
    observer.observe(contentRef.current, {
      childList: true,
      subtree: true
    })
    
    // Also try immediately in case HTML is already rendered
    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return
      
      const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
      console.log('Timeout check - Found answer input placeholders:', answerInputs.length)
      
      if (answerInputs.length === 0) {
        console.warn('No answer input placeholders found in HTML after timeout')
        return
      }
      
      // Process the found inputs (same logic as in observer)
      const roots: Array<{ container: Element; root: any }> = []
      
      answerInputs.forEach((container) => {
        const answerPath = container.getAttribute('data-answer-input')
        if (!answerPath) return
        
        // Skip if already rendered
        if ((container as any)._reactRoot) return
        
        // Get current value
        let currentValue = ''
        if (answerPath === 'writing') {
          currentValue = placementTestAnswers?.writing || ''
        } else if (answerPath === 'writingFileUpload') {
          currentValue = placementTestAnswers?.writingFileUrl || ''
        } else {
          const keys = answerPath.split('.')
          let current: any = placementTestAnswers
          for (const key of keys) {
            current = current?.[key]
          }
          currentValue = current || ''
        }
        
        // Determine input type
        let inputType: 'radio' | 'text' | 'textarea' | 'fileUpload' = 'radio'
        if (answerPath === 'writing') {
          inputType = 'textarea'
        } else if (answerPath === 'writingFileUpload') {
          inputType = 'fileUpload'
        } else if (answerPath.includes('incompleteSentences')) {
          inputType = 'text'
        }
        
        // Create React root and render component
        try {
          // Clear the container first
          container.innerHTML = ''
          const root = createRoot(container as HTMLElement)
          root.render(
            <InlineAnswerInput
              answerPath={answerPath}
              value={currentValue}
              onChange={(value) => updatePlacementTestAnswer(answerPath, value)}
              type={inputType}
              assignmentId={assignmentId}
              onFileUpload={(fileUrl) => updatePlacementTestAnswer('writingFileUrl', fileUrl)}
            />
          )
          roots.push({ container, root })
          console.log('Rendered answer input for:', answerPath)
        } catch (error) {
          console.error('Error rendering inline answer input:', error, answerPath)
        }
      })
      
      // Store roots for cleanup
      roots.forEach(({ container, root }) => {
        (container as any)._reactRoot = root
      })
    }, 500) // Increased timeout to ensure HTML is fully rendered
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
      if (contentRef.current) {
        const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
        answerInputs.forEach((container) => {
          const root = (container as any)._reactRoot
          if (root) {
            try {
              root.unmount()
            } catch (error) {
              // Ignore unmount errors
            }
          }
        })
      }
    }
  }, [isPlacementTest, resource.content, notes, assignmentId, updatePlacementTestAnswer, placementTestAnswers]) // Include placementTestAnswers

  useEffect(() => {
    // Auto-save every 30 seconds
    const autoSave = setInterval(() => {
      if (notes && status !== 'NOT_STARTED') {
        saveProgress()
      }
    }, 30000)

    return () => clearInterval(autoSave)
  }, [notes, status, saveProgress])

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
            onClick={() => saveProgress()}
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

      <div id="worksheet-content" ref={contentRef} className="border rounded-lg p-6 bg-white mb-4">
        {(() => {
          // Check if content is JSON (PDF with audio)
          let contentData: any = null
          try {
            if (resource.content.startsWith('{')) {
              contentData = JSON.parse(resource.content)
            }
          } catch (e) {
            // Not JSON, continue with normal handling
          }

          if (contentData && contentData.type === 'pdf-with-audio') {
            // PDF with audio files
            return (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">PDF Document</h3>
                  <iframe
                    src={contentData.pdf}
                    className="w-full h-[800px] border-0"
                    title={resource.title}
                  />
                </div>
                {contentData.audio && contentData.audio.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Audio Files</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Click the audio icons on the PDF above, then play the corresponding audio below.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contentData.audio.map((audio: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Audio {audio.code}
                            </span>
                            <span className="text-xs text-gray-500">{audio.filename}</span>
                          </div>
                          <audio
                            controls
                            className="w-full"
                            src={audio.path}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          } else if (resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/')) {
            // File-based content (PDF or Image)
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
          } else {
            // HTML content
            // Check if content contains an "Answers" section - if so, split and insert textarea before it
            // Look for h2 heading containing "Answers" (with optional emoji)
            const answersHeadingRegex = /(<h2[^>]*>.*?Answers.*?<\/h2>)/i
            const answersMatch = resource.content.match(answersHeadingRegex)
            
            if (answersMatch && !isPlacementTest) {
              // Split content at the Answers heading
              const answersIndex = resource.content.indexOf(answersMatch[0])
              const contentBeforeAnswers = resource.content.substring(0, answersIndex)
              const contentFromAnswers = resource.content.substring(answersIndex)
              
              return (
                <>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentBeforeAnswers }}
                  />
                  <div className="mt-6 mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Work / Answers
                    </label>
                    <textarea
                      id="notes"
                      rows={10}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                      style={{ borderColor: '#d1d5db' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                      placeholder="Type your answers or work here..."
                    />
                  </div>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentFromAnswers }}
                  />
                </>
              )
            } else {
              // No Answers section found, render normally
              return (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: resource.content }}
                />
              )
            }
          }
        })()}
      </div>

      {/* Show structured answer sheet for Placement Test, otherwise show simple textarea (only if not already rendered above) */}
      {(() => {
        // Check if textarea was already rendered in the HTML content section
        const answersHeadingRegex = /(<h2[^>]*>.*?Answers.*?<\/h2>)/i
        const hasAnswersSection = resource.content.match(answersHeadingRegex) && !resource.content.startsWith('{') && !resource.content.startsWith('/uploads/') && !resource.content.startsWith('uploads/')
        
        if (hasAnswersSection && !isPlacementTest) {
          // Textarea already rendered above, don't render again
          return null
        }
        
        if (isPlacementTest) {
          // For placement tests, all inputs are now inline - don't show the answer sheet
          return null
        } else {
          return (
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
          )
        }
      })()}

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

