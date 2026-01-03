'use client'

import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import PlacementTestAnswerSheet from './PlacementTestAnswerSheet'

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
  type = 'radio' 
}: { 
  answerPath: string
  value: string
  onChange: (value: string) => void
  type?: 'radio' | 'text'
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
  } else {
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
  }
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
  
  // Update placement test answer
  const updatePlacementTestAnswer = (path: string, value: string) => {
    const keys = path.split('.')
    const currentAnswers = placementTestAnswers || {}
    const newAnswers = JSON.parse(JSON.stringify(currentAnswers))
    let current: any = newAnswers
    
    // Initialize structure if needed
    if (!newAnswers.listening) newAnswers.listening = { photographs: {}, conversations: {} }
    if (!newAnswers.reading) newAnswers.reading = { incompleteSentences: {}, readingComprehension: {} }
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    
    const newNotes = JSON.stringify(newAnswers, null, 2)
    setNotes(newNotes)
    // Auto-save with the new notes
    setTimeout(() => {
      saveProgress(newNotes)
    }, 500)
  }
  
  // Inject inline answer inputs into HTML content
  useEffect(() => {
    if (!isPlacementTest || !contentRef.current) return
    
    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      const answerInputs = contentRef.current?.querySelectorAll('[data-answer-input]')
      if (!answerInputs) return
      
      const roots: Array<{ container: Element; root: any }> = []
      
      answerInputs.forEach((container) => {
        const answerPath = container.getAttribute('data-answer-input')
        if (!answerPath) return
        
        // Get current value
        const keys = answerPath.split('.')
        let current: any = placementTestAnswers
        for (const key of keys) {
          current = current?.[key]
        }
        const currentValue = current || ''
        
        // Determine input type
        const isTextInput = answerPath.includes('incompleteSentences')
        
        // Create React root and render component
        try {
          const root = createRoot(container as HTMLElement)
          root.render(
            <InlineAnswerInput
              answerPath={answerPath}
              value={currentValue}
              onChange={(value) => updatePlacementTestAnswer(answerPath, value)}
              type={isTextInput ? 'text' : 'radio'}
            />
          )
          roots.push({ container, root })
        } catch (error) {
          console.error('Error rendering inline answer input:', error)
        }
      })
      
      // Store roots for cleanup
      roots.forEach(({ container, root }) => {
        (container as any)._reactRoot = root
      })
    }, 100)
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
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
  }, [isPlacementTest, resource.content, placementTestAnswers])

  useEffect(() => {
    // Auto-save every 30 seconds
    const autoSave = setInterval(() => {
      if (notes && status !== 'NOT_STARTED') {
        saveProgress()
      }
    }, 30000)

    return () => clearInterval(autoSave)
  }, [notes, status])

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
          return (
            <PlacementTestAnswerSheet
              key={notes} // Force re-render when notes change
              assignmentId={assignmentId}
              initialAnswers={notes}
              onSave={async (answersJson) => {
                setNotes(answersJson)
                // Auto-save the structured answers
                await saveProgress(answersJson)
              }}
            />
          )
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

