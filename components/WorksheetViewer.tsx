'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { useRouter } from 'next/navigation'

interface Resource {
  id: string
  title: string
  content: string
  type: string
  skill?: string
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

// Memoized content component to prevent re-renders when notes change
const MemoizedContent = React.memo(function MemoizedContent({
  html,
  contentRef
}: {
  html: string
  contentRef?: React.RefObject<HTMLDivElement>
}) {
  return (
    <div 
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
      ref={contentRef}
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if HTML content actually changed
  return prevProps.html === nextProps.html
})

// Direct textarea component for Placement Test writing section (like Modal Verbs)
// Uses local state and debouncing to prevent parent re-renders during typing
const PlacementWritingTextarea = React.memo(function PlacementWritingTextarea({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isFocusedRef = useRef(false)
  const lastSyncedValueRef = useRef(value)
  
  // Sync with parent value when it changes externally (but not when focused)
  useEffect(() => {
    // Only sync if value actually changed and textarea is not focused
    if (value !== lastSyncedValueRef.current && !isFocusedRef.current && document.activeElement !== textareaRef.current) {
      setLocalValue(value)
      lastSyncedValueRef.current = value
    }
  }, [value])
  
  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={(e) => {
        const newValue = e.target.value
        setLocalValue(newValue)
        
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        // DON'T update parent during typing - only update on blur
        // This prevents parent re-renders that cause flickering
        // The parent will be updated when user blurs the textarea
      }}
      onBlur={(e) => {
        isFocusedRef.current = false
        // Save immediately on blur
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        if (localValue !== lastSyncedValueRef.current) {
          onChange(localValue)
          lastSyncedValueRef.current = localValue
        }
        e.currentTarget.style.borderColor = '#d1d5db'
      }}
      onFocus={(e) => {
        isFocusedRef.current = true
        e.currentTarget.style.borderColor = '#38438f'
      }}
      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
      style={{ 
        borderColor: '#d1d5db',
        borderRadius: '4px',
        padding: '8px',
        fontSize: '13px',
        fontFamily: 'inherit',
        minHeight: '150px',
        resize: 'vertical'
      }}
      rows={10}
      placeholder="Type your response here..."
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if value prop actually changed (not just reference)
  // This prevents re-renders when parent re-renders but value is the same
  return prevProps.value === nextProps.value && prevProps.onChange === nextProps.onChange
})

// Inline answer input component for placement test
function InlineAnswerInput({ 
  answerPath, 
  value, 
  onChange, 
  type = 'radio',
  assignmentId,
  onFileUpload,
  onTextareaFocusChange
}: { 
  answerPath: string
  value: string
  onChange: (value: string) => void
  type?: 'radio' | 'text' | 'textarea' | 'fileUpload'
  assignmentId?: string
  onFileUpload?: (fileUrl: string) => void
  onTextareaFocusChange?: (focused: boolean) => void
}) {
  // Use local state like ResourcePreview - this works!
  const [localValue, setLocalValue] = useState(value)
  
  // Sync with parent value when it changes externally (but not when input is focused)
  useEffect(() => {
    // For text inputs and textareas, don't update if focused or typing
    if (type === 'text' || type === 'textarea') {
      const activeElement = document.activeElement
      if (activeElement) {
        if (type === 'text' && activeElement.tagName === 'INPUT' && (activeElement as HTMLInputElement).type === 'text') {
          return
        }
        if (type === 'textarea' && activeElement.tagName === 'TEXTAREA') {
          return
        }
        // Also check if element is marked as typing
        if ((activeElement as any)._isTyping) {
          return
        }
      }
    }
    setLocalValue(value)
  }, [value, type])
  
  if (type === 'radio') {
    
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px', 
        zIndex: 10, 
        position: 'relative',
        pointerEvents: 'auto',
        isolation: 'isolate'
      }}>
        {['A', 'B', 'C', 'D'].map((option) => (
          <label 
            key={option} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer',
              userSelect: 'none',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 11
            }}
            onClick={(e) => {
              // Don't prevent default - allow native label behavior to trigger radio
              e.stopPropagation()
              
              // Update local state immediately for visual feedback
              setLocalValue(option)
              
              // Mark container as recently interacted to prevent re-renders
              const container = e.currentTarget.closest('[data-answer-input]')
              if (container) {
                const timestamp = Date.now()
                ;(container as any)._lastInteractionTime = timestamp
                ;(container as any)._isInteracting = true
              }
              
              // Save immediately - no delay
              onChange(option)
              // Clear interaction flag after update
              if (container) {
                ;(container as any)._isInteracting = false
              }
            }}
          >
            <input
              type="radio"
              name={answerPath}
              value={option}
              checked={localValue === option}
              onChange={(e) => {
                // Don't prevent default - allow native radio behavior
                e.stopPropagation()
                const newValue = (e.target as HTMLInputElement).value
                // Update local state immediately for visual feedback
                setLocalValue(newValue)
                // Mark container as recently interacted to prevent re-renders
                const container = e.target.closest('[data-answer-input]')
                if (container) {
                  const timestamp = Date.now()
                  ;(container as any)._lastInteractionTime = timestamp
                  ;(container as any)._isInteracting = true
                }
                // Save immediately - no delay
                onChange(newValue)
                // Clear interaction flag after update
                if (container) {
                  ;(container as any)._isInteracting = false
                }
              }}
              onBlur={(e) => {
                // Save value when radio loses focus (user clicks elsewhere)
                if (localValue !== value) {
                  onChange(localValue)
                }
                const container = e.target.closest('[data-answer-input]')
                if (container) {
                  ;(container as any)._isInteracting = false
                }
                e.stopPropagation()
              }}
              style={{ 
                width: '16px', 
                height: '16px', 
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 12,
                position: 'relative',
                margin: 0,
                flexShrink: 0
              }}
            />
            <span style={{ 
              fontSize: '13px', 
              pointerEvents: 'none',
              userSelect: 'none'
            }}>{option}</span>
          </label>
        ))}
      </div>
    )
  } else if (type === 'text') {
    // Use exact same pattern as ResourcePreview - it works!
    // Don't call onChange while typing - only on blur or debounced
    const textTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          e.stopPropagation()
          const newValue = e.target.value
          setLocalValue(newValue)
          
          // Mark input as typing to prevent re-renders
          const inputElement = e.target
          ;(inputElement as any)._isTyping = true
          
          // Clear previous timeout
          if (textTimeoutRef.current) {
            clearTimeout(textTimeoutRef.current)
          }
          
          // Only call onChange after user stops typing (debounced)
          // This prevents state updates during typing, which prevents re-renders
          textTimeoutRef.current = setTimeout(() => {
            onChange(newValue)
            ;(inputElement as any)._isTyping = false
          }, 500) // 500ms after last keystroke
        }}
        onBlur={(e) => {
          // Clear timeout and save immediately on blur
          if (textTimeoutRef.current) {
            clearTimeout(textTimeoutRef.current)
            textTimeoutRef.current = null
          }
          if (localValue !== value) {
            onChange(localValue)
          }
          ;(e.target as any)._isTyping = false
          e.stopPropagation()
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '13px',
          width: '120px',
          marginLeft: '8px',
          pointerEvents: 'auto'
        }}
        placeholder="Answer"
      />
    )
  } else if (type === 'textarea') {
    // Use same pattern as text input that works - local state with debouncing
    const textareaTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    
    return (
      <textarea
        ref={textareaRef}
        value={localValue || ''}
        onChange={(e) => {
          e.stopPropagation()
          const newValue = e.target.value
          const scrollY = window.scrollY
          const scrollX = window.scrollX
          
          // Store cursor position
          const cursorPos = e.target.selectionStart || newValue.length
          
          setLocalValue(newValue)
          
          // Mark textarea as typing to prevent re-renders
          const textareaElement = e.target
          ;(textareaElement as any)._isTyping = true
          ;(textareaElement as any)._lastInteractionTime = Date.now()
          
          // Clear previous timeout
          if (textareaTimeoutRef.current) {
            clearTimeout(textareaTimeoutRef.current)
          }
          
          // Only call onChange after user stops typing (debounced)
          // This prevents state updates during typing, which prevents re-renders
          textareaTimeoutRef.current = setTimeout(() => {
            onChange(newValue)
            ;(textareaElement as any)._isTyping = false
            
            // Restore scroll position and cursor after state update
            requestAnimationFrame(() => {
              window.scrollTo(scrollX, scrollY)
              if (textareaRef.current && document.activeElement === textareaRef.current) {
                textareaRef.current.setSelectionRange(cursorPos, cursorPos)
              }
            })
          }, 500) // 500ms after last keystroke
        }}
        onFocus={(e) => {
          e.stopPropagation()
          // Mark as typing when focused to prevent any re-renders
          ;(e.target as any)._isTyping = true
          ;(e.target as any)._lastInteractionTime = Date.now()
          // Notify parent that textarea is focused
          onTextareaFocusChange?.(true)
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          // Track every keystroke to prevent re-renders
          ;(e.target as any)._lastInteractionTime = Date.now()
        }}
        onBlur={(e) => {
          // Clear timeout and save immediately on blur
          if (textareaTimeoutRef.current) {
            clearTimeout(textareaTimeoutRef.current)
            textareaTimeoutRef.current = null
          }
          if (localValue !== value) {
            onChange(localValue)
          }
          ;(e.target as any)._isTyping = false
          // Keep lastInteractionTime for a bit longer to prevent immediate re-render
          ;(e.target as any)._lastInteractionTime = Date.now()
          // Notify parent that textarea lost focus (with delay to check if moved to another)
          setTimeout(() => {
            const stillFocused = document.activeElement?.tagName === 'TEXTAREA'
            onTextareaFocusChange?.(stillFocused)
          }, 50)
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.stopPropagation()
          // Track clicks to prevent re-renders
          ;(e.target as any)._lastInteractionTime = Date.now()
        }}
        style={{
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          minHeight: '150px',
          resize: 'vertical',
          pointerEvents: 'auto',
          zIndex: 2,
          position: 'relative'
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
                style={{ fontSize: '13px', color: '#ba3627', marginTop: '8px', display: 'block', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
  const router = useRouter()
  const [notes, setNotes] = useState(initialProgress?.notes || '')
  const [status, setStatus] = useState(initialProgress?.status || 'NOT_STARTED')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Check if this is a Placement Test
  const isPlacementTest = resource.title.toLowerCase().includes('placement test')
  
  // Check if this is a Reference resource
  const isReference = resource.skill === 'REFERENCE'
  
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
  
  // Memoize writing value to prevent unnecessary re-renders
  const writingAnswerValue = useMemo(() => {
    return placementTestAnswers.writing || ''
  }, [placementTestAnswers.writing])

  // Track if any textarea is focused using a ref (persists across renders)
  const textareaFocusRef = useRef(false)

  // Update placement test answer - use useCallback but read from notes directly to avoid stale closures
  const updatePlacementTestAnswer = useCallback((path: string, value: string) => {
    // Read current notes directly to avoid stale closure
    setNotes((currentNotes) => {
      let currentAnswers: any = {}
      try {
        if (currentNotes) {
          currentAnswers = JSON.parse(currentNotes)
        }
      } catch (e) {
        // If notes aren't valid JSON, start fresh
      }
      
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
      return newNotes
    })
  }, []) // No dependencies - uses functional setState to read current value
  
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
  
  // Helper function to get current value for an answer path
  const getAnswerValue = useCallback((answerPath: string, answers: any) => {
    if (answerPath === 'writing') {
      return answers?.writing || ''
    } else if (answerPath === 'writingFileUpload') {
      return answers?.writingFileUrl || ''
    } else {
      const keys = answerPath.split('.')
      let current: any = answers
      for (const key of keys) {
        current = current?.[key]
      }
      return current || ''
    }
  }, [])

  // Helper function to determine input type
  const getInputType = useCallback((answerPath: string): 'radio' | 'text' | 'textarea' | 'fileUpload' => {
    if (answerPath === 'writing') {
      return 'textarea'
    } else if (answerPath === 'writingFileUpload') {
      return 'fileUpload'
    } else if (answerPath.includes('incompleteSentences')) {
      return 'text'
    }
    return 'radio'
  }, [])

  // Helper function to render or update an answer input
  const renderAnswerInput = useCallback((container: Element, answerPath: string, answers: any) => {
    const currentValue = getAnswerValue(answerPath, answers)
    const inputType = getInputType(answerPath)
    
    // If root already exists, just update it
    if ((container as any)._reactRoot) {
      const root = (container as any)._reactRoot
      root.render(
        <InlineAnswerInput
          answerPath={answerPath}
          value={currentValue}
          onChange={(value) => updatePlacementTestAnswer(answerPath, value)}
          type={inputType}
          assignmentId={assignmentId}
          onFileUpload={(fileUrl) => updatePlacementTestAnswer('writingFileUrl', fileUrl)}
          onTextareaFocusChange={(focused) => {
            textareaFocusRef.current = focused
          }}
        />
      )
      return
    }
    
    // Create new root
    try {
      container.innerHTML = ''
      const containerEl = container as HTMLElement
      containerEl.style.pointerEvents = 'auto'
      containerEl.style.position = 'relative'
      containerEl.style.zIndex = '10'
      containerEl.style.isolation = 'isolate'
      containerEl.setAttribute('data-interactive', 'true')
      
      const root = createRoot(containerEl)
      root.render(
        <InlineAnswerInput
          answerPath={answerPath}
          value={currentValue}
          onChange={(value) => updatePlacementTestAnswer(answerPath, value)}
          type={inputType}
          assignmentId={assignmentId}
          onFileUpload={(fileUrl) => updatePlacementTestAnswer('writingFileUrl', fileUrl)}
          onTextareaFocusChange={(focused) => {
            textareaFocusRef.current = focused
          }}
        />
      )
      ;(container as any)._reactRoot = root
      console.log('Rendered answer input for:', answerPath, 'type:', inputType)
    } catch (error) {
      console.error('Error rendering inline answer input:', error, answerPath)
    }
  }, [getAnswerValue, getInputType, updatePlacementTestAnswer, assignmentId, textareaFocusRef])

  // Inject inline answer inputs into HTML content - only runs when content changes
  useEffect(() => {
    if (!isPlacementTest || !contentRef.current) return
    
    const initializeInputs = () => {
      if (!contentRef.current) return
      
      const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
      console.log('Found answer input placeholders:', answerInputs.length)
      
      if (answerInputs.length === 0) {
        return false // Not ready yet
      }
      
      answerInputs.forEach((container) => {
        const answerPath = container.getAttribute('data-answer-input')
        if (!answerPath) return
        
        // Skip the writing textarea - it's now a direct JSX component, not a portal
        if (answerPath === 'writing') {
          return // Skip portal rendering for writing textarea
        }
        
        // Only create if it doesn't exist - don't recreate
        if (!(container as any)._reactRoot) {
          renderAnswerInput(container, answerPath, placementTestAnswers)
        }
      })
      
      return true // Successfully initialized
    }
    
    // Try immediately
    if (!initializeInputs()) {
      // If not ready, use MutationObserver and timeout
      const observer = new MutationObserver(() => {
        if (initializeInputs()) {
          observer.disconnect()
        }
      })
      
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true
      })
      
      const timeoutId = setTimeout(() => {
        observer.disconnect()
        initializeInputs()
      }, 500)
      
      return () => {
        clearTimeout(timeoutId)
        observer.disconnect()
        // Don't unmount on cleanup - we want to keep the inputs alive
      }
    }
    
    return () => {
      // Don't unmount on cleanup - we want to keep the inputs alive
    }
  }, [isPlacementTest, resource.content, renderAnswerInput, placementTestAnswers]) // Only recreate when content changes

  // Update existing answer inputs when notes/answers change - separate effect
  // But skip updates for inputs that are currently focused/interactive to prevent losing focus
  useEffect(() => {
    if (!isPlacementTest || !contentRef.current) return
    
    // CRITICAL: If ANY textarea is focused, completely skip ALL portal updates
    // Check both ref and actual DOM state for reliability
    const anyTextareaFocused = textareaFocusRef.current || 
      Array.from(contentRef.current.querySelectorAll('textarea')).some(
        textarea => document.activeElement === textarea
      )
    
    if (anyTextareaFocused) {
      // Textarea is focused - DO NOT update portal components, prevent all re-renders
      return
    }
    
    const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
    
    answerInputs.forEach((container) => {
      const answerPath = container.getAttribute('data-answer-input')
      if (!answerPath) return
      
      // Only update if root exists - don't create new ones here
      if ((container as any)._reactRoot) {
        const inputType = getInputType(answerPath)
        
        // For textareas: NEVER update via root.render() - they manage their own state
        // This prevents any re-renders that could cause focus loss
        if (inputType === 'textarea') {
          // Don't update textareas at all - they use local state and sync on blur
          return
        }
        
        // For text inputs, check if they're currently focused or being typed in
        if (inputType === 'text') {
          const inputElement = container.querySelector('input[type="text"]') as HTMLInputElement
          if (inputElement) {
            const isFocused = document.activeElement === inputElement
            const isTyping = (inputElement as any)._isTyping
            const hasRecentInteraction = (inputElement as any)._lastInteractionTime && 
              Date.now() - (inputElement as any)._lastInteractionTime < 1000
            
            if (isFocused || isTyping || hasRecentInteraction) {
              // Input is focused, being typed, or recently interacted with - don't re-render
              return
            }
          }
        }
        
        // For radio buttons, skip if recently interacted with to prevent interrupting audio
        if (inputType === 'radio') {
          const lastInteraction = (container as any)._lastInteractionTime
          const isInteracting = (container as any)._isInteracting
          // Skip re-render if interacted within last 2 seconds or currently interacting
          if (isInteracting || (lastInteraction && Date.now() - lastInteraction < 2000)) {
            return
          }
        }
        
        const root = (container as any)._reactRoot
        const currentValue = getAnswerValue(answerPath, placementTestAnswers)
        
        // Use requestAnimationFrame to batch updates and prevent interrupting interactions
        requestAnimationFrame(() => {
          // Double-check textarea focus state before rendering
          if (textareaFocusRef.current) {
            return
          }
          
          if ((container as any)._reactRoot === root) {
            root.render(
              <InlineAnswerInput
                answerPath={answerPath}
                value={currentValue}
                onChange={(value) => updatePlacementTestAnswer(answerPath, value)}
                type={inputType}
                assignmentId={assignmentId}
                onFileUpload={(fileUrl) => updatePlacementTestAnswer('writingFileUrl', fileUrl)}
                onTextareaFocusChange={(focused) => {
                  textareaFocusRef.current = focused
                }}
              />
            )
          }
        })
      }
    })
  }, [notes, isPlacementTest, getAnswerValue, getInputType, updatePlacementTestAnswer, assignmentId, placementTestAnswers]) // Update values when notes change

  // Cleanup: Only unmount when component unmounts or resource content changes significantly
  useEffect(() => {
    return () => {
      // This cleanup only runs when component unmounts or when dependencies change
      // Since resource.content is in the dependency array above, this will clean up old inputs
      if (contentRef.current) {
        const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
        answerInputs.forEach((container) => {
          const root = (container as any)._reactRoot
          if (root) {
            try {
              root.unmount()
              delete (container as any)._reactRoot
            } catch (error) {
              // Ignore unmount errors
            }
          }
        })
      }
    }
  }, [resource.content]) // Only cleanup when resource content actually changes

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
        setShowCompletionModal(true)
        // Refresh the router to update cached data
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to mark complete:', errorData)
        alert(`Failed to mark as complete: ${errorData.error || 'Please try again'}`)
      }
    } catch (error) {
      console.error('Failed to mark complete:', error)
      alert('Failed to mark as complete. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    // If content is a PDF file, open it for printing
    if (resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/')) {
      const filePath = resource.content.startsWith('/') ? resource.content : `/${resource.content}`
      if (filePath.toLowerCase().endsWith('.pdf')) {
        window.open(filePath, '_blank')
        return
      }
    }

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
      // For PDF with audio, open the PDF for printing
      window.open(contentData.pdf, '_blank')
      return
    }

    // For HTML content or images, use print window
    const element = document.getElementById('worksheet-content')
    if (!element) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to print this resource.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resource.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; }
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🖨️ Print
          </button>
          {isPlacementTest && (
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
          )}
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
            // Render HTML content as-is to match teacher view exactly
            if (isPlacementTest) {
              // For Placement Test, split content at the writing textarea placeholder
              // and render the textarea directly in JSX (like Modal Verbs) to prevent flickering
              const writingPlaceholderRegex = /(<div\s+data-answer-input="writing"[^>]*><\/div>)/i
              const writingMatch = resource.content.match(writingPlaceholderRegex)
              
              if (writingMatch) {
                const writingIndex = resource.content.indexOf(writingMatch[0])
                const contentBeforeWriting = resource.content.substring(0, writingIndex)
                const contentAfterWriting = resource.content.substring(writingIndex + writingMatch[0].length)
                
                // Memoize content sections to prevent re-renders when notes change
                const memoizedContentBefore = useMemo(() => contentBeforeWriting, [resource.content])
                const memoizedContentAfter = useMemo(() => contentAfterWriting, [resource.content])
                
                // Memoize the onChange callback to prevent re-renders
                const handleWritingChange = useCallback((value: string) => {
                  updatePlacementTestAnswer('writing', value)
                }, [updatePlacementTestAnswer])
                
                return (
                  <>
                    <MemoizedContent 
                      key="content-before-writing"
                      html={memoizedContentBefore}
                      contentRef={contentRef}
                    />
                    <div style={{ marginTop: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#000' }}>
                        Your Response:
                      </label>
                      <PlacementWritingTextarea
                        key="placement-writing-textarea"
                        value={writingAnswerValue}
                        onChange={handleWritingChange}
                      />
                      <MemoizedContent 
                        key="content-after-writing"
                        html={memoizedContentAfter}
                      />
                    </div>
                  </>
                )
              } else {
                // No writing placeholder found, render normally
                return (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: resource.content }}
                    ref={contentRef}
                  />
                )
              }
            } else {
              // Render normally for non-placement tests (match teacher view exactly)
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

      {status !== 'COMPLETED' && (
        <div className="mt-4">
          <button
            onClick={markComplete}
            className="px-6 py-2 text-white rounded-md"
            style={{ backgroundColor: '#38438f' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3569'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38438f'}
          >
            {isReference ? 'Mark as Read' : 'Mark as Complete'}
          </button>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>⚠️ This worksheet is unique to you. Do not share the link with anyone.</p>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false)
            router.push('/student/course')
          }}
          worksheetName={resource.title}
          isReference={isReference}
        />
      )}
    </div>
  )
}

// Completion Modal Component
function CompletionModal({
  isOpen,
  onClose,
  worksheetName,
  isReference = false
}: {
  isOpen: boolean
  onClose: () => void
  worksheetName: string
  isReference?: boolean
}) {
  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#38438f20' }}
              >
                <span className="text-4xl">🎉</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
              {isReference ? 'Marked as Read!' : 'Congratulations!'}
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {isReference ? (
                <>You have marked <strong>{worksheetName}</strong> as read. Your teacher will be notified.</>
              ) : (
                <>Congratulations on completing <strong>{worksheetName}</strong> 🎉<br />
                Your teacher will be notified of your progress.</>
              )}
            </p>

            {/* Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 text-white rounded-md font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#38438f' }}
            >
              Back to My Course
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

