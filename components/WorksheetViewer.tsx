'use client'

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { mountAircraftAviationAdjectiveMatch } from '@/lib/worksheetInteractions/aircraftAviationAdjectivesMatch'
import { mountAircraftAviationVerbsGapFill } from '@/lib/worksheetInteractions/aircraftAviationVerbsGapFill'
import { mountInstructionsDescriptionsArmyAdjectiveMatch } from '@/lib/worksheetInteractions/instructionsDescriptionsArmyAdjectivesMatch'
import { mountInstructionsDescriptionsArmyVerbsMission } from '@/lib/worksheetInteractions/instructionsDescriptionsArmyVerbsMission'
import { mountVocabularySeriesGapFill } from '@/lib/worksheetInteractions/vocabularySeriesGapFill'
import { mountPastSimpleArmyEdPronunciation } from '@/lib/worksheetInteractions/pastSimpleArmyEdPronunciation'
import {
  mergeGiaqMatchPlacementsIntoNotes,
  mountUnmountedGivingInformationActivities,
  parseGiaqMatchPlacementsFromNotes,
  type GiaqActivityPersistence,
} from '@/lib/worksheetInteractions/givingInformationAnsweringQuestions'
import { mountPhraseAudioButtons } from '@/lib/worksheetInteractions/phraseAudioButtons'
import { mountPresentingServicesProductsActivities } from '@/lib/worksheetInteractions/presentingServicesProductsKeyLanguage'
import { mountWritingPracticeTimers } from '@/lib/worksheetInteractions/writingPracticeTimers'
import { mountPlacementTestCheckAnswers } from '@/lib/worksheetInteractions/placementTestCheckAnswers'
import {
  formatFeedbackForDisplay,
  getFeedbackNotesKey,
  getInputIdForTask,
  isWritingTaskType,
  type WritingTaskType,
} from '@/lib/writing-feedback'

interface Resource {
  id: string
  title: string
  content: string
  type: string
  skill?: string
  createdAt?: string
  updatedAt?: string
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
  /** When true, the full student UI is shown but progress is not saved to the server. */
  preventSave?: boolean
  backHref?: string
  backLabel?: string
  /** Hide toolbars and action buttons — for embedded previews only. */
  compact?: boolean
  showStudentNotice?: boolean
}

type GrammarCheckStatus = 'correct' | 'incorrect' | 'review'

interface GrammarCheckResult {
  status: GrammarCheckStatus
}

const normalizeAnswerValue = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:()[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const textareaAnswerMatches = (value: string, expected: string[]): boolean => {
  if (!value || !expected.length) return false
  const v = normalizeAnswerValue(value)
  return expected.some((token) => {
    if (!token) return false
    const t = normalizeAnswerValue(token)
    return v === t || v.includes(t) || t.includes(v)
  })
}

const parseGrammarAcceptable = (raw: string | null): string[] => {
  if (!raw) return []
  return raw
    .split('|')
    .map((part) => normalizeAnswerValue(part))
    .filter(Boolean)
}

const expandAnswerVariants = (value: string): string[] => {
  const trimmed = value.trim()
  if (!trimmed) return []

  const pieces = trimmed
    .split(/\s*(?:\/| or )\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)

  return pieces.length ? pieces : [trimmed]
}

/** Remove trailing grammar-note parentheses, e.g. "waters (Present Simple - habitual action)". */
const stripAnswerKeyAnnotation = (value: string): string => {
  return value.replace(/\s*\([^)]*\)\s*$/g, '').trim()
}

/** Parse one answer-key line into one group per blank (ellipsis = multiple blanks). */
const parseAnswerKeyLine = (raw: string): string[][] => {
  const stripped = stripAnswerKeyAnnotation(raw.trim())
  if (!stripped) return []

  if (/\.\.\./.test(stripped)) {
    return stripped
      .split(/\s*\.\.\.\s*/)
      .map((part) =>
        expandAnswerVariants(part)
          .map((token) => normalizeAnswerValue(token))
          .filter(Boolean)
      )
      .filter((group) => group.length > 0)
  }

  const variants = expandAnswerVariants(stripped)
    .map((token) => normalizeAnswerValue(token))
    .filter(Boolean)

  return variants.length ? [variants] : []
}

const buildPrefixLabelRegex = (prefix: string): RegExp | null => {
  const match = prefix.match(/^([a-zA-Z]+)(\d+)$/)
  if (!match) return null

  const [, word, number] = match
  const phraseMap: Record<string, string> = {
    gf: 'grammar focus',
    practice: 'practice',
    vocab: 'vocabulary focus',
    reading: 'reading',
    prep: 'prepositions',
  }

  const phrase = phraseMap[word.toLowerCase()]
  if (!phrase) return null

  const safePhrase = phrase.replace(/\s+/g, '\\s+')
  return new RegExp(`${safePhrase}\\s*#?\\s*${number}`, 'i')
}

const isAnswerKeyHeading = (rawText: string): boolean => {
  const text = rawText.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!text) return false
  if (text.includes('answer key')) return true
  if (/^📝\s*answers?$/.test(text)) return true
  if (/^answers?$/.test(text)) return true
  if (/^📝\s*answer key$/.test(text)) return true
  return false
}

const extractAnswerTokenGroups = (scope: ParentNode): string[][] => {
  const list = scope.querySelector('ol, ul')

  if (list) {
    return Array.from(list.querySelectorAll('li'))
      .flatMap((item) => {
        const strongTokens = Array.from(item.querySelectorAll('strong'))
          .map((el) => (el.textContent || '').trim())
          .filter(Boolean)

        if (strongTokens.length) {
          return strongTokens.map((token) =>
            expandAnswerVariants(stripAnswerKeyAnnotation(token))
              .map((part) => normalizeAnswerValue(part))
              .filter(Boolean)
          ).filter((group) => group.length > 0)
        }

        return parseAnswerKeyLine((item.textContent || '').trim())
      })
      .filter((group) => group.length > 0)
  }

  const strongTokens = Array.from(scope.querySelectorAll('strong'))
    .map((el) => (el.textContent || '').trim())
    .filter(Boolean)
    .flatMap((token) => expandAnswerVariants(token))
    .map((token) => normalizeAnswerValue(token))
    .filter(Boolean)

  if (strongTokens.length) {
    return strongTokens.map((token) => [token])
  }

  return []
}

/** Normalise student text for native `.prep-input` + `data-correct` worksheets (scripts in HTML are not run by React). */
function prepNorm(s: string): string {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function parsePrepAcceptable(raw: string | null): string[] {
  if (!raw) return []
  const parts = raw.split('|').map(prepNorm).filter((x) => x.length > 0)
  if (parts.length === 0 && prepNorm(raw)) {
    return [prepNorm(raw)]
  }
  return parts
}

type PrepCheckOutcome = 'empty' | 'nocriteria' | 'correct' | 'incorrect'

function applyPrepInputCheck(inp: HTMLInputElement): PrepCheckOutcome {
  const got = prepNorm(inp.value)
  if (got === '') {
    inp.style.borderWidth = '1px'
    inp.style.borderStyle = 'solid'
    inp.style.borderColor = '#94a3b8'
    inp.style.background = ''
    return 'empty'
  }
  const acceptable = parsePrepAcceptable(inp.getAttribute('data-correct'))
  if (acceptable.length === 0) {
    inp.style.borderWidth = '1px'
    inp.style.borderStyle = 'solid'
    inp.style.borderColor = '#94a3b8'
    inp.style.background = ''
    return 'nocriteria'
  }
  const ok = acceptable.indexOf(got) !== -1
  inp.style.borderWidth = '2px'
  inp.style.borderStyle = 'solid'
  inp.style.borderColor = ok ? '#16a34a' : '#dc2626'
  inp.style.background = ok ? '#f0fdf4' : '#fef2f2'
  return ok ? 'correct' : 'incorrect'
}

const CHECK_ICON_TICK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none'%3E%3Ccircle cx='10' cy='10' r='9' fill='%2316a34a'/%3E%3Cpath d='M6 10.5L8.6 13L14 7.5' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
const CHECK_ICON_CROSS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none'%3E%3Ccircle cx='10' cy='10' r='9' fill='%23dc2626'/%3E%3Cpath d='M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`

// Memoized content component to prevent re-renders when notes change
// (Do not attach contentRef here — #worksheet-content is the single ref root so listeners and querySelector see one tree.)
const MemoizedContent = React.memo(function MemoizedContent({
  html,
  fullWidth = false,
}: {
  html: string
  fullWidth?: boolean
}) {
  return (
    <div
      className={fullWidth ? 'prose max-w-none w-full' : 'prose max-w-none'}
      style={fullWidth ? { width: '100%', maxWidth: '100%' } : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if HTML content actually changed
  return prevProps.html === nextProps.html && prevProps.fullWidth === nextProps.fullWidth
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

export default function WorksheetViewer({
  assignmentId,
  resource,
  initialProgress,
  preventSave = false,
  backHref = '/student/course',
  backLabel = 'Return to My Course',
  compact = false,
  showStudentNotice = true,
}: WorksheetViewerProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialProgress?.notes || '')
  const [status, setStatus] = useState(initialProgress?.status || 'NOT_STARTED')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [grammarInputsReady, setGrammarInputsReady] = useState(false)
  const [isClientMounted, setIsClientMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  // Ref to hold latest notes for save - avoids stale state when Save clicked right after typing
  const notesRef = useRef(notes)
  notesRef.current = notes
  const latestSaveIdRef = useRef(0)
  const giaqPersistenceRef = useRef<GiaqActivityPersistence | null>(null)
  giaqPersistenceRef.current = {
    getMatchPlacements: (matchKey) => parseGiaqMatchPlacementsFromNotes(notesRef.current, matchKey),
    setMatchPlacements: (matchKey, placements) => {
      const newNotes = mergeGiaqMatchPlacementsIntoNotes(notesRef.current, matchKey, placements)
      notesRef.current = newNotes
      setNotes(newNotes)
    },
  }

  // Check if this is a Placement Test
  const isPlacementTest = resource.title.toLowerCase().includes('placement test')
  
  // Check if this is a Reference resource
  const isReference = resource.skill === 'REFERENCE'
  
  // Check if this resource has grammar worksheet inputs
  const hasGrammarInputs = resource.content.includes('data-grammar-input')

  /** Interactive Key Language + Listening; HTML must not re-render via dangerouslySetInnerHTML. */
  const hasKlActivity =
    typeof resource.content === 'string' && resource.content.includes('data-kl-activity')
  const hasListeningActivity =
    typeof resource.content === 'string' && resource.content.includes('data-listening-activity')
  const hasGiaqActivities =
    typeof resource.content === 'string' &&
    (resource.content.includes('data-giaq-match') || resource.content.includes('data-giaq-listening'))
  const hasPspActivities = hasKlActivity || hasListeningActivity
  const hasVocabGapFill =
    typeof resource.content === 'string' && resource.content.includes('data-vocab-gap-fill-mount')
  const hasMountedWorksheetActivities = hasPspActivities || hasGiaqActivities || hasVocabGapFill
  const hasPhraseAudioRoot =
    typeof resource.content === 'string' && resource.content.includes('data-phrase-audio-root')
  const hasWritingTimers =
    typeof resource.content === 'string' && resource.content.includes('data-writing-timer-minutes')

  /** Per-section Check Answers + live tick/cross (see resources using data-grammar-per-section-check). */
  const enablePerSectionGrammarCheck = useMemo(() => {
    return (
      /prepositions of time and place/i.test(resource.title || '') ||
      /advanced prepositions/i.test(resource.title || '') ||
      (typeof resource.content === 'string' && resource.content.includes('data-grammar-per-section-check'))
    )
  }, [resource.title, resource.content])

  // Defer interactive worksheet render until after hydration (HTML worksheets use dangerouslySetInnerHTML).
  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  // Defer grammar input injection until after mount/hydration (avoids timing issues)
  useEffect(() => {
    if (hasGrammarInputs) {
      const id = requestAnimationFrame(() => {
        setGrammarInputsReady(true)
      })
      return () => cancelAnimationFrame(id)
    }
  }, [hasGrammarInputs])

  // Sequential listening audio: one player, multiple sources (e.g. conversation then questions)
  useEffect(() => {
    if (!contentRef.current || !resource.content.includes('data-itl-chained-audio')) return

    const cleanups: Array<() => void> = []

    const setup = () => {
      const players = Array.from(
        contentRef.current!.querySelectorAll('audio[data-itl-chained-audio="true"]')
      ) as HTMLAudioElement[]

      players.forEach((audio) => {
        const sources = (audio.getAttribute('data-itl-audio-sources') || '')
          .split('|')
          .map((src) => src.trim())
          .filter(Boolean)
        if (sources.length < 2) return

        let segment = 0
        let chaining = false
        audio.src = sources[0]

        const onEnded = () => {
          const next = segment + 1
          if (next < sources.length) {
            chaining = true
            segment = next
            audio.src = sources[next]!
            audio.load()
            void audio.play().finally(() => {
              chaining = false
            })
          }
        }

        const onPlay = () => {
          if (chaining) return
          if (audio.ended || (audio.currentTime < 0.15 && segment > 0)) {
            segment = 0
            if (!audio.src.endsWith(sources[0]!)) {
              audio.src = sources[0]!
              audio.load()
            }
          }
        }

        audio.addEventListener('ended', onEnded)
        audio.addEventListener('play', onPlay)
        cleanups.push(() => {
          audio.removeEventListener('ended', onEnded)
          audio.removeEventListener('play', onPlay)
        })
      })
    }

    const id = requestAnimationFrame(setup)
    return () => {
      cancelAnimationFrame(id)
      cleanups.forEach((fn) => fn())
    }
  }, [resource.content])
  
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
  
  // Parse grammar worksheet answers from notes
  const getGrammarAnswers = () => {
    if (!hasGrammarInputs || !notes) return {}
    try {
      const parsed = JSON.parse(notes)
      // If it's a placement test structure, check for grammarAnswers property
      if (isPlacementTest && parsed.grammarAnswers) {
        return parsed.grammarAnswers
      }
      // Otherwise, if it's just grammar answers, return the whole thing
      if (!isPlacementTest) {
        return parsed
      }
      return {}
    } catch {
      return {}
    }
  }
  
  const grammarAnswers = getGrammarAnswers()

  const applyGrammarResultStyles = useCallback((field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, result: GrammarCheckStatus) => {
    field.style.backgroundImage = 'none'
    field.style.backgroundRepeat = 'no-repeat'
    field.style.backgroundSize = '14px 14px'
    field.style.paddingRight = '24px'
    field.style.backgroundPosition = field.tagName === 'TEXTAREA' ? 'calc(100% - 6px) 8px' : 'calc(100% - 6px) center'

    if (result === 'correct') {
      field.style.borderColor = '#16a34a'
      field.style.backgroundColor = '#f0fdf4'
      field.style.backgroundImage = CHECK_ICON_TICK
      return
    }
    if (result === 'incorrect') {
      field.style.borderColor = '#dc2626'
      field.style.backgroundColor = '#fef2f2'
      field.style.backgroundImage = CHECK_ICON_CROSS
      return
    }
    field.style.borderColor = '#d97706'
    field.style.backgroundColor = '#fffbeb'
  }, [])

  const buildGrammarAnswerMap = useCallback((): Map<string, string[]> => {
    const answerMap = new Map<string, string[]>()
    if (!contentRef.current) return answerMap

    const allInputs = Array.from(contentRef.current.querySelectorAll('[data-grammar-input]')) as HTMLElement[]
    if (!allInputs.length) return answerMap

    allInputs.forEach((el) => {
      const inputId = el.getAttribute('data-grammar-input')
      if (!inputId || answerMap.has(inputId)) return
      const acceptableRaw =
        el.getAttribute('data-grammar-acceptable') || el.getAttribute('data-correct')
      if (!acceptableRaw) return
      const tokens = parseGrammarAcceptable(acceptableRaw)
      if (tokens.length) answerMap.set(inputId, tokens)
    })

    const groupedByPrefix = new Map<string, string[]>()
    allInputs.forEach((el) => {
      const inputId = el.getAttribute('data-grammar-input')
      if (!inputId) return
      const prefix = inputId.split('-')[0]
      const current = groupedByPrefix.get(prefix) || []
      current.push(inputId)
      groupedByPrefix.set(prefix, current)
    })

    const answerHeading = Array.from(contentRef.current.querySelectorAll('h2, h3')).find((heading) =>
      isAnswerKeyHeading(heading.textContent || '')
    )
    if (!answerHeading) return answerMap

    const answerRoot = answerHeading.closest('div') || answerHeading.parentElement
    if (!answerRoot) return answerMap

    const answerSectionHeadings = Array.from(answerRoot.querySelectorAll('h3'))

    groupedByPrefix.forEach((inputIds, prefix) => {
      const matcher = buildPrefixLabelRegex(prefix)
      let matchedHeading: HTMLHeadingElement | undefined

      if (matcher) {
        matchedHeading = answerSectionHeadings.find((heading) => matcher.test(heading.textContent || '')) as HTMLHeadingElement | undefined
      }

      if (!matchedHeading) {
        matchedHeading = answerSectionHeadings.find((heading) => (heading.textContent || '').toLowerCase().includes(prefix.toLowerCase())) as HTMLHeadingElement | undefined
      }

      if (!matchedHeading) {
        return
      }

      const matchedSection = matchedHeading.parentElement || matchedHeading
      const tokenGroups = extractAnswerTokenGroups(matchedSection)

      inputIds.forEach((id, index) => {
        if (answerMap.has(id)) return
        const group = tokenGroups[index]
        if (!group?.length) return
        answerMap.set(id, group)
      })
    })

    // Fallback: if section matching failed (or was partial), map remaining inputs
    // in DOM order to remaining answer token groups in the answers area.
    if (answerMap.size < allInputs.length) {
      const allAnswerTokenGroups = answerSectionHeadings
        .map((heading) => heading.parentElement || heading)
        .flatMap((section) => extractAnswerTokenGroups(section))

      const unresolvedIds = allInputs
        .map((el) => el.getAttribute('data-grammar-input') || '')
        .filter(Boolean)
        .filter((id) => !answerMap.has(id))

      unresolvedIds.forEach((id, index) => {
        const group = allAnswerTokenGroups[index]
        if (!group?.length) return
        answerMap.set(id, group)
      })
    }

    return answerMap
  }, [])

  const runGrammarCheckForContainer = useCallback((container: HTMLElement, answerMap: Map<string, string[]>) => {
    const inputContainers = Array.from(container.querySelectorAll('[data-grammar-input]')) as HTMLElement[]
    if (!inputContainers.length) return

    let correct = 0
    let incorrect = 0
    let review = 0

    inputContainers.forEach((inputContainer) => {
      const inputId = inputContainer.getAttribute('data-grammar-input')
      if (!inputId) return

      const expected = answerMap.get(inputId) || []
      const rawType = inputContainer.getAttribute('data-grammar-input-type')
      const inputType =
        rawType === 'textarea'
          ? 'textarea'
          : rawType === 'select'
            ? 'select'
            : rawType === 'radio'
              ? 'radio'
              : 'text'

      let result: GrammarCheckResult
      if (inputType === 'radio') {
        const checked = inputContainer.querySelector(
          'input[type=radio]:checked'
        ) as HTMLInputElement | null
        const radioValue = checked ? normalizeAnswerValue(checked.value) : ''
        const expected = answerMap.get(inputId) || []
        if (!radioValue) {
          result = { status: 'review' }
        } else if (!expected.length) {
          result = { status: 'review' }
        } else if (expected.some((token) => normalizeAnswerValue(token) === radioValue)) {
          result = { status: 'correct' }
        } else {
          result = { status: 'incorrect' }
        }
        inputContainer.style.borderRadius = '6px'
        inputContainer.style.padding = '8px 10px'
        if (result.status === 'correct') {
          inputContainer.style.border = '2px solid #16a34a'
          inputContainer.style.backgroundColor = '#f0fdf4'
        } else if (result.status === 'incorrect') {
          inputContainer.style.border = '2px solid #dc2626'
          inputContainer.style.backgroundColor = '#fef2f2'
        } else {
          inputContainer.style.border = '2px solid #d97706'
          inputContainer.style.backgroundColor = '#fffbeb'
        }
        if (result.status === 'correct') correct += 1
        else if (result.status === 'incorrect') incorrect += 1
        else review += 1
        return
      }

      const field = inputContainer.querySelector('input, textarea, select') as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null
      if (!field) return

      const value = normalizeAnswerValue(field.value || '')

      if (!value) {
        result = { status: 'review' }
      } else if (inputType === 'textarea') {
        if (!expected.length) {
          result = { status: 'review' }
        } else if (textareaAnswerMatches(value, expected)) {
          result = { status: 'correct' }
        } else {
          result = { status: 'incorrect' }
        }
      } else if (!expected.length) {
        result = { status: 'review' }
      } else if (expected.some((token) => normalizeAnswerValue(token) === value)) {
        result = { status: 'correct' }
      } else {
        result = { status: 'incorrect' }
      }

      applyGrammarResultStyles(field, result.status)

      if (result.status === 'correct') correct += 1
      else if (result.status === 'incorrect') incorrect += 1
      else review += 1
    })

    const resultNode = container.querySelector('.grammar-check-summary') as HTMLElement | null
    if (resultNode) {
      resultNode.textContent = `Checked: ${correct} correct, ${incorrect} to retry${review ? `, ${review} to review` : ''}.`
    }
  }, [applyGrammarResultStyles])
  
  // Memoize writing value to prevent unnecessary re-renders
  const writingAnswerValue = useMemo(() => {
    return placementTestAnswers.writing || ''
  }, [placementTestAnswers.writing])

  // Track if any textarea is focused using a ref (persists across renders)
  const textareaFocusRef = useRef(false)

  // Update grammar worksheet answer - also update notesRef synchronously so Save button gets latest
  const updateGrammarAnswer = useCallback((inputId: string, value: string) => {
    const currentNotes = notesRef.current || '{}'
    let currentData: any = {}
    try {
      currentData = JSON.parse(currentNotes)
    } catch (e) {
      // If notes aren't valid JSON, start fresh
    }
    const newData = JSON.parse(JSON.stringify(currentData))
    if (isPlacementTest) {
      if (!newData.grammarAnswers) newData.grammarAnswers = {}
      newData.grammarAnswers[inputId] = value
    } else {
      newData[inputId] = value
    }
    const newNotes = JSON.stringify(newData, null, 2)
    notesRef.current = newNotes // Sync ref before setState so Save gets latest
    setNotes(newNotes)
  }, [isPlacementTest])
  
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

  /** Split placement HTML at writing placeholder — must be useMemo at top level (not inside render IIFE). */
  const placementHtmlSplit = useMemo((): { before: string; after: string } | null => {
    if (!isPlacementTest || !resource.content) return null
    let contentData: unknown = null
    try {
      if (resource.content.startsWith('{')) {
        contentData = JSON.parse(resource.content)
      }
    } catch {
      contentData = null
    }
    if (
      contentData &&
      typeof contentData === 'object' &&
      contentData !== null &&
      (contentData as { type?: string }).type === 'pdf-with-audio'
    ) {
      return null
    }
    if (resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/')) {
      return null
    }
    const writingPlaceholderRegex = /(<div\s+data-answer-input="writing"[^>]*><\/div>)/i
    const writingMatch = resource.content.match(writingPlaceholderRegex)
    if (!writingMatch) return null
    const writingIndex = resource.content.indexOf(writingMatch[0])
    return {
      before: resource.content.substring(0, writingIndex),
      after: resource.content.substring(writingIndex + writingMatch[0].length),
    }
  }, [isPlacementTest, resource.content])

  const handlePlacementWritingChange = useCallback(
    (value: string) => updatePlacementTestAnswer('writing', value),
    [updatePlacementTestAnswer]
  )

  /** Read live values from injected grammar fields into notesRef (and optionally React state). */
  const flushGrammarInputsToNotes = useCallback(
    (syncState = true): string => {
      if (!hasGrammarInputs || !contentRef.current) {
        return notesRef.current || notes || ''
      }

      let currentData: Record<string, unknown> = {}
      try {
        currentData = JSON.parse(notesRef.current || '{}') as Record<string, unknown>
      } catch {
        currentData = {}
      }

      const containers = contentRef.current.querySelectorAll('[data-grammar-input]')
      containers.forEach((container) => {
        const inputId = container.getAttribute('data-grammar-input')
        if (!inputId) return

        const textarea = container.querySelector('textarea')
        const textInput = container.querySelector('input[type="text"]')
        const select = container.querySelector('select')
        const checkedRadio = container.querySelector('input[type="radio"]:checked')

        let value = ''
        if (textarea) value = textarea.value
        else if (select) value = (select as HTMLSelectElement).value
        else if (checkedRadio) value = (checkedRadio as HTMLInputElement).value
        else if (textInput) value = (textInput as HTMLInputElement).value

        if (isPlacementTest) {
          if (!currentData.grammarAnswers || typeof currentData.grammarAnswers !== 'object') {
            currentData.grammarAnswers = {}
          }
          ;(currentData.grammarAnswers as Record<string, string>)[inputId] = value
        } else {
          currentData[inputId] = value
        }
      })

      const newNotes = JSON.stringify(currentData, null, 2)
      notesRef.current = newNotes
      if (syncState) {
        setNotes(newNotes)
      }
      return newNotes
    },
    [hasGrammarInputs, isPlacementTest, notes]
  )

  const saveProgress = useCallback(
    async (notesToSave?: string): Promise<boolean> => {
      if (preventSave) return true

      const saveId = ++latestSaveIdRef.current

      let notesValue: string
      if (notesToSave !== undefined) {
        notesValue = notesToSave
      } else if (hasGrammarInputs) {
        notesValue = flushGrammarInputsToNotes(true)
      } else {
        notesValue = notesRef.current || notes
      }

      const statusToSave = status === 'NOT_STARTED' ? 'IN_PROGRESS' : status

      setSaving(true)
      try {
        const response = await fetch(`/api/progress/${assignmentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: notesValue,
            status: statusToSave,
          }),
        })

        if (saveId !== latestSaveIdRef.current) {
          return false
        }

        if (response.ok) {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
          if (status === 'NOT_STARTED') {
            setStatus('IN_PROGRESS')
          }
          return true
        }

        console.error('Failed to save progress:', await response.text().catch(() => ''))
        return false
      } catch (error) {
        console.error('Failed to save progress:', error)
        return false
      } finally {
        if (saveId === latestSaveIdRef.current) {
          setSaving(false)
        }
      }
    },
    [assignmentId, flushGrammarInputsToNotes, hasGrammarInputs, notes, preventSave, status]
  )
  
  // Auto-save placement test answers when notes change
  useEffect(() => {
    if (preventSave) return
    if (isPlacementTest && notes) {
      const timeoutId = setTimeout(() => saveProgress(), 500)
      return () => clearTimeout(timeoutId)
    }
  }, [notes, isPlacementTest, preventSave, saveProgress])
  
  // Auto-save grammar worksheet answers when notes change
  useEffect(() => {
    if (preventSave) return
    if (hasGrammarInputs && !isPlacementTest && notes) {
      const timeoutId = setTimeout(() => saveProgress(), 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [notes, hasGrammarInputs, isPlacementTest, preventSave, saveProgress])

  // Auto-save GIAQ drag-and-drop placements when notes change
  useEffect(() => {
    if (preventSave) return
    if (!hasGiaqActivities || isPlacementTest || !notes) return
    const timeoutId = setTimeout(() => saveProgress(), 800)
    return () => clearTimeout(timeoutId)
  }, [notes, hasGiaqActivities, isPlacementTest, preventSave, saveProgress])
  
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

  // Placement test section "Check Answers" buttons (listening + reading).
  useEffect(() => {
    if (!isPlacementTest || !isClientMounted || !contentRef.current) return
    if (!resource.content.includes('data-placement-check')) return

    const host = contentRef.current
    const getAnswer = (path: string) => {
      let answers: Record<string, unknown> = {}
      try {
        if (notesRef.current) {
          answers = JSON.parse(notesRef.current)
        }
      } catch {
        // ignore invalid notes JSON
      }
      return getAnswerValue(path, answers)
    }

    let detach = mountPlacementTestCheckAnswers(host, getAnswer)

    const retryId = window.setTimeout(() => {
      detach()
      detach = mountPlacementTestCheckAnswers(host, getAnswer)
    }, 600)

    return () => {
      window.clearTimeout(retryId)
      detach()
    }
  }, [isPlacementTest, isClientMounted, resource.content, getAnswerValue])

  // Grammar worksheet input component - supports text input, textarea and select
  const GrammarInput = React.memo(function GrammarInput({
    inputId,
    value,
    onChange,
    inputType = 'text',
    width,
    options = [],
    textareaRows,
    textareaMinHeight,
  }: {
    inputId: string
    value: string
    onChange: (value: string) => void
    inputType?: 'text' | 'textarea' | 'select' | 'radio'
    width?: string
    options?: string[]
    textareaRows?: number
    textareaMinHeight?: string
  }) {
    const [localValue, setLocalValue] = useState(value)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const selectRef = useRef<HTMLSelectElement>(null)
    
    // Sync with parent value when it changes externally (but not when focused)
    useEffect(() => {
      const isFocused =
        document.activeElement === inputRef.current ||
        document.activeElement === textareaRef.current ||
        document.activeElement === selectRef.current
      if (value !== localValue && !isFocused) {
        setLocalValue(value)
      }
    }, [value])
    
    const commonPropsWithoutRef = {
      value: localValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setLocalValue(newValue)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => onChange(newValue), 500)
      },
      onBlur: () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        onChange(localValue)
      }
    }
    
    const inputStyle: React.CSSProperties = {
      border: '1px solid #d1d5db',
      borderBottom: '2px solid #38438f',
      borderRadius: '2px',
      padding: '2px 4px',
      fontSize: '14px',
      fontFamily: 'inherit',
      backgroundColor: '#fff',
      minWidth: width || '150px',
      width: width || '150px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      outline: 'none',
      display: 'inline-block',
      verticalAlign: 'baseline'
    }
    
    const textareaStyle: React.CSSProperties = {
      ...inputStyle,
      display: 'block',
      width: '100%',
      minWidth: '100%',
      minHeight: textareaMinHeight || '60px',
      padding: '8px',
      resize: 'vertical',
      marginTop: '4px'
    }
    
    if (inputType === 'textarea') {
      return (
        <textarea
          {...commonPropsWithoutRef}
          ref={textareaRef}
          style={textareaStyle}
          rows={textareaRows || 2}
        />
      )
    }

    if (inputType === 'select') {
      return (
        <select
          ref={selectRef}
          value={localValue}
          onChange={(e) => {
            const newValue = e.target.value
            setLocalValue(newValue)
            onChange(newValue)
          }}
          style={{
            ...inputStyle,
            padding: '4px 8px',
            height: '32px',
            minWidth: width || '180px',
            width: width || '180px'
          }}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (inputType === 'radio') {
      const letters = options.length ? options : ['A', 'B', 'C', 'D']
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {letters.map((option) => (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              <input
                type="radio"
                name={inputId}
                value={option}
                checked={localValue === option}
                onChange={(e) => {
                  const newValue = e.target.value
                  setLocalValue(newValue)
                  onChange(newValue)
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    }

    return (
      <input
        {...commonPropsWithoutRef}
        ref={inputRef}
        type="text"
        style={inputStyle}
      />
    )
  })
  
  // Render grammar worksheet inputs (after grammarInputsReady to avoid hydration timing issues)
  useEffect(() => {
    if (!hasGrammarInputs || !grammarInputsReady || !contentRef.current) return
    
    const initializeGrammarInputs = () => {
      if (!contentRef.current) return
      
      const grammarInputs = contentRef.current.querySelectorAll('[data-grammar-input]')
      
      if (grammarInputs.length === 0) {
        return false // Not ready yet
      }
      
      grammarInputs.forEach((container) => {
        const inputId = container.getAttribute('data-grammar-input')
        if (!inputId) return
        
        // Skip if already rendered
        if ((container as any)._reactRoot) {
          return
        }
        
        const inputTypeAttr = container.getAttribute('data-grammar-input-type')
        const inputType =
          inputTypeAttr === 'textarea'
            ? 'textarea'
            : inputTypeAttr === 'select'
              ? 'select'
              : inputTypeAttr === 'radio'
                ? 'radio'
                : 'text'
        const options =
          (container.getAttribute('data-grammar-input-options') || '')
            .split('|')
            .map((option) => option.trim())
            .filter(Boolean)
        const configuredWidth = (container as HTMLElement).style.minWidth || (container as HTMLElement).style.width || undefined
        const textareaRows = parseInt(container.getAttribute('data-grammar-textarea-rows') || '', 10)
        const textareaMinHeight = (container as HTMLElement).style.minHeight || undefined
        
        try {
          container.innerHTML = ''
          const containerEl = container as HTMLElement
          containerEl.style.pointerEvents = 'auto'
          containerEl.style.position = 'relative'
          containerEl.style.zIndex = '10'
          if (inputType === 'radio' || inputType === 'textarea') {
            containerEl.style.display = 'block'
          } else {
            containerEl.style.display = 'inline-block'
            if (configuredWidth) {
              containerEl.style.minWidth = configuredWidth
              containerEl.style.width = configuredWidth
              containerEl.style.maxWidth = configuredWidth
            }
          }
          
          const root = createRoot(containerEl)
          // Get current grammar answers
          const currentGrammarAnswers = getGrammarAnswers()
          const currentValue = currentGrammarAnswers[inputId] || ''
          
          root.render(
            <GrammarInput
              inputId={inputId}
              value={currentValue}
              onChange={(value) => updateGrammarAnswer(inputId, value)}
              inputType={inputType}
              width={configuredWidth}
              options={options}
              textareaRows={Number.isFinite(textareaRows) ? textareaRows : undefined}
              textareaMinHeight={textareaMinHeight}
            />
          )
          
          ;(container as any)._reactRoot = root
        } catch (error) {
          console.error('Error rendering grammar input:', error, inputId)
        }
      })
      
      return true
    }
    
    // Try immediately, then retry (handles hydration/timing)
    if (!initializeGrammarInputs()) {
      const timeoutId = setTimeout(() => {
        initializeGrammarInputs()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
    
    return () => {
      // Don't unmount on cleanup - we want to keep the inputs alive
    }
  }, [hasGrammarInputs, grammarInputsReady, resource.content, updateGrammarAnswer])
  
  // Update grammar inputs when answers change
  useEffect(() => {
    if (!hasGrammarInputs || !contentRef.current) return

    // Skip portal re-render while typing/selecting so focus is preserved; live-check still reapplies styles below.
    const anyInputFocused = Array.from(
      contentRef.current.querySelectorAll('input[type="text"], textarea, select')
    ).some((el) => document.activeElement === el)

    if (!anyInputFocused) {
      const currentGrammarAnswers = getGrammarAnswers()
      const grammarInputs = contentRef.current.querySelectorAll('[data-grammar-input]')

      grammarInputs.forEach((container) => {
        const inputId = container.getAttribute('data-grammar-input')
        if (!inputId) return

        const inputTypeAttr = container.getAttribute('data-grammar-input-type')
        const inputType =
          inputTypeAttr === 'textarea'
            ? 'textarea'
            : inputTypeAttr === 'select'
              ? 'select'
              : inputTypeAttr === 'radio'
                ? 'radio'
                : 'text'
        const options =
          (container.getAttribute('data-grammar-input-options') || '')
            .split('|')
            .map((option) => option.trim())
            .filter(Boolean)
        const configuredWidth = (container as HTMLElement).style.minWidth || (container as HTMLElement).style.width || undefined
        const textareaRows = parseInt(container.getAttribute('data-grammar-textarea-rows') || '', 10)
        const textareaMinHeight = (container as HTMLElement).style.minHeight || undefined
        const root = (container as any)._reactRoot
        if (root) {
          const currentValue = currentGrammarAnswers[inputId] || ''
          root.render(
            <GrammarInput
              inputId={inputId}
              value={currentValue}
              onChange={(value) => updateGrammarAnswer(inputId, value)}
              inputType={inputType}
              width={configuredWidth}
              options={options}
              textareaRows={Number.isFinite(textareaRows) ? textareaRows : undefined}
              textareaMinHeight={textareaMinHeight}
            />
          )
        }
      })
    }

    // Re-apply tick/cross after React re-renders inputs (inline styles from Check Answers are otherwise cleared).
    const liveSections = Array.from(
      contentRef.current.querySelectorAll('[data-grammar-live-check="true"]')
    ) as HTMLElement[]
    if (liveSections.length > 0) {
      const answerMap = buildGrammarAnswerMap()
      const reapplyLiveCheck = () => {
        liveSections.forEach((sec) => runGrammarCheckForContainer(sec, answerMap))
      }
      reapplyLiveCheck()
      requestAnimationFrame(reapplyLiveCheck)
    }
  }, [notes, hasGrammarInputs, updateGrammarAnswer, buildGrammarAnswerMap, runGrammarCheckForContainer])

  // Per-section "Check answers" for selected worksheets (e.g. Prepositions #1–#4). Practice blocks
  // can opt out with data-grammar-check-disabled="true" on their .keep-together (e.g. free-text #5).
  useEffect(() => {
    if (!hasGrammarInputs || !contentRef.current || !grammarInputsReady) return

    if (!enablePerSectionGrammarCheck) {
      const existingControls = contentRef.current.querySelectorAll('.grammar-check-controls')
      existingControls.forEach((control) => control.remove())
      return
    }

    const styleId = 'grammar-check-screen-only-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @media print {
          .screen-only {
            display: none !important;
          }
        }
      `
      document.head.appendChild(style)
    }

    const inputContainers = Array.from(contentRef.current.querySelectorAll('[data-grammar-input]')) as HTMLElement[]
    const sectionMap = new Map<HTMLElement, HTMLElement[]>()

    inputContainers.forEach((inputContainer) => {
      const section =
        (inputContainer.closest('[data-grammar-per-section-check]') as HTMLElement | null) ||
        (inputContainer.closest('.keep-together') as HTMLElement | null) ||
        (inputContainer.closest('[class*="-keep-together"]') as HTMLElement | null) ||
        (inputContainer.closest('div') as HTMLElement | null)
      if (!section) return
      const current = sectionMap.get(section) || []
      current.push(inputContainer)
      sectionMap.set(section, current)
    })

    const cleanupFns: Array<() => void> = []
    sectionMap.forEach((_inputs, section) => {
      if (section.getAttribute('data-grammar-check-disabled') === 'true') return
      if (section.querySelector('.grammar-check-controls')) return

      const controls = document.createElement('div')
      controls.className = 'grammar-check-controls screen-only'
      controls.style.display = 'flex'
      controls.style.alignItems = 'center'
      controls.style.gap = '10px'
      controls.style.marginTop = '10px'

      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = 'Check Answers'
      button.style.backgroundColor = '#38438f'
      button.style.color = '#fff'
      button.style.border = 'none'
      button.style.borderRadius = '6px'
      button.style.padding = '6px 10px'
      button.style.fontSize = '13px'
      button.style.cursor = 'pointer'

      const summary = document.createElement('div')
      summary.className = 'grammar-check-summary'
      summary.style.fontSize = '12px'
      summary.style.fontWeight = '600'
      summary.style.color = '#1f2937'

      const clickHandler = () => {
        const answerMap = buildGrammarAnswerMap()
        runGrammarCheckForContainer(section, answerMap)
        section.setAttribute('data-grammar-live-check', 'true')
      }
      button.addEventListener('click', clickHandler)
      cleanupFns.push(() => button.removeEventListener('click', clickHandler))

      controls.appendChild(button)
      controls.appendChild(summary)
      section.appendChild(controls)
    })

    return () => {
      cleanupFns.forEach((fn) => fn())
      if (!contentRef.current) return
      const controls = contentRef.current.querySelectorAll('.grammar-check-controls')
      controls.forEach((control) => control.remove())
    }
  }, [hasGrammarInputs, grammarInputsReady, resource.content, resource.title, buildGrammarAnswerMap, runGrammarCheckForContainer, enablePerSectionGrammarCheck])

  const migrateLegacyAiFeedbackMarkup = useCallback((panel: HTMLElement) => {
    panel.querySelectorAll('.grammar-ai-feedback-scroll-hint').forEach((el) => el.remove())
    const legacyInner = panel.querySelector('.grammar-ai-feedback-scroll-inner')
    if (legacyInner) {
      while (legacyInner.firstChild) {
        panel.insertBefore(legacyInner.firstChild, legacyInner)
      }
      legacyInner.remove()
    }
  }, [])

  const applyAiFeedbackPanelStyles = useCallback((panel: HTMLElement) => {
    panel.style.display = 'block'
    panel.style.boxSizing = 'border-box'
    panel.style.height = 'min(38vh, 300px)'
    panel.style.maxHeight = 'min(38vh, 300px)'
    panel.style.minHeight = '200px'
    ;(panel.style as CSSStyleDeclaration & { overscrollBehavior?: string }).overscrollBehavior =
      'contain'
    panel.style.overflowX = 'hidden'
    panel.style.overflowY = 'scroll'
    panel.style.scrollbarGutter = 'stable'
    panel.style.padding = '14px 16px 18px 16px'
    panel.style.border = '2px solid #818cf8'
    panel.style.borderRadius = '8px'
    panel.style.background = '#f8fafc'
    panel.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.15)'
    ;(panel.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string }).webkitOverflowScrolling =
      'touch'
    panel.setAttribute('tabindex', '0')
    panel.setAttribute('role', 'region')
    panel.setAttribute('aria-label', 'AI feedback — scroll inside this box to read all comments')
  }, [])

  const showAiFeedbackMessage = useCallback(
    (panel: HTMLElement, message: string, variant: 'loading' | 'error') => {
      migrateLegacyAiFeedbackMarkup(panel)
      if (variant === 'error') {
        panel.style.display = 'block'
        panel.style.height = 'auto'
        panel.style.maxHeight = 'none'
        panel.style.overflowY = 'visible'
        panel.style.padding = '14px 16px'
        panel.style.border = '2px solid #fca5a5'
        panel.style.background = '#fef2f2'
        panel.innerHTML = `<p style="margin:0;font-size:14px;color:#dc2626;">${message.replace(/</g, '&lt;')}</p>`
        return
      }
      applyAiFeedbackPanelStyles(panel)
      panel.innerHTML = `<p style="margin:0;font-size:14px;color:#64748b;">${message.replace(/</g, '&lt;')}</p>`
    },
    [applyAiFeedbackPanelStyles, migrateLegacyAiFeedbackMarkup]
  )

  const renderAiFeedbackPanel = useCallback(
    (
      panel: HTMLElement,
      structural: { items: { ok: boolean; message: string }[] },
      aiMarkdown: string,
      sourceNote?: string
    ) => {
      migrateLegacyAiFeedbackMarkup(panel)
      applyAiFeedbackPanelStyles(panel)

      const structuralHtml = structural.items
        .map(
          (item) =>
            `<li style="margin-bottom:6px;color:${item.ok ? '#047857' : '#b45309'};">${item.ok ? '✓' : '○'} ${item.message.replace(/</g, '&lt;')}</li>`
        )
        .join('')

      const sourceNoteHtml = sourceNote
        ? `<p style="margin:0 0 10px 0;padding:10px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;font-size:13px;color:#92400e;line-height:1.5;">${sourceNote.replace(/</g, '&lt;')}</p>`
        : ''

      panel.innerHTML = `
        <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#64748b;">Instant checks</p>
        <ul style="margin:0 0 14px 0;padding-left:20px;font-size:13px;line-height:1.5;">${structuralHtml}</ul>
        <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#64748b;">AI feedback <span style="font-weight:400;">(not human marking)</span></p>
        ${sourceNoteHtml}
        <div class="grammar-ai-feedback-body" style="font-size:14px;line-height:1.6;color:#334155;padding-bottom:8px;">${formatFeedbackForDisplay(aiMarkdown)}</div>
      `
    },
    [applyAiFeedbackPanelStyles, migrateLegacyAiFeedbackMarkup]
  )

  const getAiFeedbackMount = useCallback((section: HTMLElement, aiTask: WritingTaskType) => {
    const host = section.closest('[data-grammar-ai-feedback-host]') as HTMLElement | null
    const inHost =
      (host?.querySelector(`.grammar-ai-feedback-mount[data-for="${aiTask}"]`) as HTMLElement | null) ||
      (host?.querySelector('.grammar-ai-feedback-mount') as HTMLElement | null)
    if (inHost) return inHost
    const parent = section.parentElement
    return (
      (parent?.querySelector(`.grammar-ai-feedback-mount[data-for="${aiTask}"]`) as HTMLElement | null) ||
      (parent?.querySelector('.grammar-ai-feedback-mount') as HTMLElement | null)
    )
  }, [])

  const clearOrphanAiFeedbackPanels = useCallback(
    (host: HTMLElement | null, mount: HTMLElement | null) => {
      if (!host) return
      host.querySelectorAll('.grammar-ai-feedback-panel').forEach((panel) => {
        if (!mount?.contains(panel)) panel.remove()
      })
    },
    []
  )

  const readGrammarAnswerFromNotes = useCallback((inputId: string): string => {
    try {
      const parsed = JSON.parse(notesRef.current || '{}') as Record<string, string>
      return parsed[inputId] || ''
    } catch {
      return ''
    }
  }, [])

  const getWritingAnswerText = useCallback(
    (section: HTMLElement, inputId: string): string => {
      const host =
        (section.closest('[data-grammar-ai-feedback-host]') as HTMLElement | null) ?? section
      const textarea = host.querySelector('textarea') as HTMLTextAreaElement | null
      const domValue = textarea?.value?.trim() ?? ''
      if (domValue) {
        updateGrammarAnswer(inputId, domValue)
        return domValue
      }
      return readGrammarAnswerFromNotes(inputId).trim()
    },
    [readGrammarAnswerFromNotes, updateGrammarAnswer]
  )

  // Per-section "Save" and optional "Get AI Feedback" for long-form writing (TOEIC Writing).
  // Depends only on resource mount — not on saveProgress/callbacks (avoids tearing down panels mid-request).
  useEffect(() => {
    if (!hasGrammarInputs || !contentRef.current || !grammarInputsReady) return
    if (!resource.content.includes('data-grammar-save-section')) return

    const cleanupFns: Array<() => void> = []
    const sections = Array.from(
      contentRef.current.querySelectorAll('[data-grammar-save-section]')
    ) as HTMLElement[]

    const buttonStyle = {
      backgroundColor: '#38438f',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'pointer',
    }

    sections.forEach((section) => {
      if (section.querySelector('.grammar-save-controls')) return

      const aiTaskAttr = section.getAttribute('data-grammar-ai-feedback')
      const aiTask = aiTaskAttr && isWritingTaskType(aiTaskAttr) ? aiTaskAttr : null

      const controls = document.createElement('div')
      controls.className = 'grammar-save-controls screen-only'
      controls.style.display = 'flex'
      controls.style.flexWrap = 'wrap'
      controls.style.alignItems = 'center'
      controls.style.gap = '10px'
      controls.style.marginTop = '10px'

      const saveButton = document.createElement('button')
      saveButton.type = 'button'
      saveButton.textContent = 'Save'
      Object.assign(saveButton.style, buttonStyle)

      const saveFeedback = document.createElement('span')
      saveFeedback.className = 'grammar-save-feedback'
      saveFeedback.style.fontSize = '13px'
      saveFeedback.style.fontWeight = '600'
      saveFeedback.style.color = '#059669'

      const saveClickHandler = async () => {
        const active = document.activeElement
        if (active instanceof HTMLTextAreaElement && section.contains(active)) {
          active.blur()
        }
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
        const ok = await saveProgress()
        saveButton.disabled = false
        saveButton.textContent = 'Save'
        if (ok) {
          saveFeedback.textContent = '✓ Saved'
          saveFeedback.style.color = '#059669'
        } else {
          saveFeedback.textContent = 'Save failed — please try again'
          saveFeedback.style.color = '#dc2626'
        }
        window.setTimeout(() => {
          saveFeedback.textContent = ''
        }, 3000)
      }
      saveButton.addEventListener('click', saveClickHandler)
      cleanupFns.push(() => saveButton.removeEventListener('click', saveClickHandler))

      controls.appendChild(saveButton)
      controls.appendChild(saveFeedback)

      let aiPanel: HTMLElement | null = null

      if (aiTask) {
        const aiButton = document.createElement('button')
        aiButton.type = 'button'
        aiButton.textContent = 'Get AI Feedback'
        Object.assign(aiButton.style, { ...buttonStyle, backgroundColor: '#1e40af' })

        const aiStatus = document.createElement('span')
        aiStatus.style.fontSize = '12px'
        aiStatus.style.color = '#64748b'

        aiPanel = document.createElement('div')
        aiPanel.className = 'grammar-ai-feedback-panel screen-only'
        aiPanel.style.display = 'none'
        aiPanel.style.marginTop = '16px'
        aiPanel.dataset.aiTask = aiTask

        const aiClickHandler = async () => {
          if (!aiPanel) return
          const panel = aiPanel
          const inputId = getInputIdForTask(aiTask)
          const active = document.activeElement
          if (active instanceof HTMLTextAreaElement) {
            active.blur()
          }

          const text = getWritingAnswerText(section, inputId)
          if (!text) {
            aiStatus.textContent = 'Please write your answer first.'
            aiStatus.style.color = '#dc2626'
            return
          }

          aiButton.disabled = true
          aiButton.textContent = 'Getting feedback...'
          aiStatus.textContent = ''
          aiStatus.style.color = '#64748b'
          showAiFeedbackMessage(panel, 'Analysing your writing… Please wait a moment.', 'loading')
          panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' })

          try {
            const res = await fetch('/api/writing-feedback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ assignmentId, taskType: aiTask, text }),
            })
            const data = await res.json()
            if (!res.ok) {
              throw new Error(data.error || 'Failed to get feedback')
            }

            renderAiFeedbackPanel(panel, data.structural, data.aiFeedback, data.aiSourceNote)
            requestAnimationFrame(() => {
              panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            })

            const feedbackKey = getFeedbackNotesKey(aiTask)
            updateGrammarAnswer(
              feedbackKey,
              JSON.stringify({
                structural: data.structural,
                aiFeedback: data.aiFeedback,
                aiSource: data.aiSource,
                aiSourceNote: data.aiSourceNote,
                generatedAt: data.generatedAt,
              })
            )
            updateGrammarAnswer(data.rateLimitKey, data.generatedAt)
            await saveProgress()

            aiStatus.textContent = '✓ Feedback ready'
            aiStatus.style.color = '#059669'
            window.setTimeout(() => {
              aiStatus.textContent = ''
            }, 3000)
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Something went wrong'
            showAiFeedbackMessage(panel, msg, 'error')
            aiStatus.textContent = ''
          } finally {
            aiButton.disabled = false
            aiButton.textContent = 'Get AI Feedback'
          }
        }

        aiButton.addEventListener('click', aiClickHandler)
        cleanupFns.push(() => aiButton.removeEventListener('click', aiClickHandler))

        controls.appendChild(aiButton)
        controls.appendChild(aiStatus)

        const host = section.closest('[data-grammar-ai-feedback-host]') as HTMLElement | null
        const mount = getAiFeedbackMount(section, aiTask)
        clearOrphanAiFeedbackPanels(host, mount)
        if (mount) {
          mount.querySelectorAll('.grammar-ai-feedback-panel').forEach((el) => el.remove())
          mount.appendChild(aiPanel)
          mount.style.overflow = 'visible'
          let ancestor: HTMLElement | null = mount.parentElement
          while (ancestor && ancestor !== contentRef.current) {
            ancestor.style.overflow = 'visible'
            ancestor.style.breakInside = 'auto'
            ;(ancestor.style as CSSStyleDeclaration & { pageBreakInside?: string }).pageBreakInside =
              'auto'
            ancestor = ancestor.parentElement
          }
        } else if (section.parentElement) {
          section.parentElement.insertBefore(aiPanel, section.nextSibling)
        } else {
          section.appendChild(aiPanel)
        }

        const feedbackKey = getFeedbackNotesKey(aiTask)
        try {
          const raw = readGrammarAnswerFromNotes(feedbackKey)
          if (raw) {
            const saved = JSON.parse(raw) as {
              structural?: { items: { ok: boolean; message: string }[] }
              aiFeedback?: string
              aiSourceNote?: string
            }
            if (saved.structural?.items?.length && saved.aiFeedback) {
              renderAiFeedbackPanel(aiPanel, saved.structural, saved.aiFeedback, saved.aiSourceNote)
            }
          }
        } catch {
          /* ignore invalid saved feedback */
        }
      }

      section.appendChild(controls)
    })

    return () => {
      cleanupFns.forEach((fn) => fn())
      // Keep panels/buttons in the DOM — removing them here caused feedback to vanish ~30s later
      // when unrelated re-renders re-ran this effect (e.g. auto-save). Teardown only on resource change.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: stable mount; handlers use latest closure
  }, [hasGrammarInputs, grammarInputsReady, resource.content])

  // Remove injected controls/panels only when the worksheet HTML changes (navigation / resource update).
  useEffect(() => {
    return () => {
      if (!contentRef.current) return
      contentRef.current.querySelectorAll('.grammar-save-controls').forEach((el) => el.remove())
      contentRef.current.querySelectorAll('.grammar-ai-feedback-panel').forEach((el) => el.remove())
    }
  }, [resource.content])

  // Re-apply saved AI feedback when notes change (auto-save, restore after navigation, etc.).
  useEffect(() => {
    if (!hasGrammarInputs || !grammarInputsReady || !contentRef.current) return
    if (!resource.content.includes('data-grammar-save-section')) return

    const tasks = Array.from(
      contentRef.current.querySelectorAll('[data-grammar-save-section][data-grammar-ai-feedback]')
    )
      .map((el) => el.getAttribute('data-grammar-ai-feedback'))
      .filter((attr): attr is WritingTaskType => !!attr && isWritingTaskType(attr))
    const uniqueTasks = [...new Set(tasks)]

    for (const task of uniqueTasks) {
      const section = contentRef.current.querySelector(
        `[data-grammar-save-section][data-grammar-ai-feedback="${task}"]`
      ) as HTMLElement | null
      if (!section) continue

      let raw = ''
      try {
        raw = readGrammarAnswerFromNotes(getFeedbackNotesKey(task))
      } catch {
        continue
      }
      if (!raw) continue

      let saved: {
        structural?: { items: { ok: boolean; message: string }[] }
        aiFeedback?: string
        aiSourceNote?: string
      }
      try {
        saved = JSON.parse(raw)
      } catch {
        continue
      }
      if (!saved.structural?.items?.length || !saved.aiFeedback) continue

      const mount = getAiFeedbackMount(section, task)
      if (!mount) continue

      let panel = mount.querySelector(
        `.grammar-ai-feedback-panel[data-ai-task="${task}"]`
      ) as HTMLElement | null

      if (!panel) {
        panel = document.createElement('div')
        panel.className = 'grammar-ai-feedback-panel screen-only'
        panel.style.marginTop = '16px'
        panel.dataset.aiTask = task
        mount.appendChild(panel)
      }

      renderAiFeedbackPanel(panel, saved.structural, saved.aiFeedback, saved.aiSourceNote)
    }
  }, [
    notes,
    hasGrammarInputs,
    grammarInputsReady,
    resource.content,
    readGrammarAnswerFromNotes,
    getAiFeedbackMount,
    renderAiFeedbackPanel,
  ])

  // After the first Check Answers for a section, update tick/cross when the student edits (vocabulary-style).
  useEffect(() => {
    if (!hasGrammarInputs || !grammarInputsReady || !contentRef.current) return
    if (!enablePerSectionGrammarCheck) return

    const root = contentRef.current

    const handleFieldValueChange = (e: Event) => {
      const target = e.target
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return
      }
      const section = target.closest('[data-grammar-live-check="true"]')
      if (!section || !(section instanceof HTMLElement)) return
      if (!root.contains(section)) return

      const answerMap = buildGrammarAnswerMap()
      runGrammarCheckForContainer(section, answerMap)
    }

    root.addEventListener('input', handleFieldValueChange, true)
    root.addEventListener('change', handleFieldValueChange, true)

    return () => {
      root.removeEventListener('input', handleFieldValueChange, true)
      root.removeEventListener('change', handleFieldValueChange, true)
    }
  }, [hasGrammarInputs, grammarInputsReady, resource.title, resource.content, buildGrammarAnswerMap, runGrammarCheckForContainer, enablePerSectionGrammarCheck])

  // Worksheets with native <input class="prep-input" data-correct="..."> rely on a trailing <script> in the HTML file.
  // React's dangerouslySetInnerHTML does not execute those scripts, so "Check answers" must be wired here.
  useEffect(() => {
    const html = resource.content
    if (typeof html !== 'string') return
    if (!html.includes('prep-input') || !html.includes('check-answers-btn')) return

    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const root = contentRef.current
      if (!root) return

      const onClick = (e: MouseEvent) => {
        const t = e.target
        if (!(t instanceof Element)) return
        const btn = t.closest('button.check-answers-btn')
        if (!btn || !root.contains(btn)) return
        const block = btn.closest('.practice-with-check')
        if (!block) return
        block.setAttribute('data-prep-checked', 'true')
        block.querySelectorAll('.prep-input').forEach((el) => {
          if (!(el instanceof HTMLInputElement)) return
          const outcome = applyPrepInputCheck(el)
          if (outcome === 'incorrect') {
            el.setAttribute('data-prep-live-track', 'true')
          } else {
            el.removeAttribute('data-prep-live-track')
          }
        })
      }

      const onInput = (e: Event) => {
        const t = e.target
        if (!(t instanceof HTMLInputElement)) return
        if (!t.classList.contains('prep-input')) return
        const block = t.closest('.practice-with-check')
        if (!block || block.getAttribute('data-prep-checked') !== 'true') return
        if (!t.hasAttribute('data-prep-live-track')) return
        const outcome = applyPrepInputCheck(t)
        if (outcome === 'correct') {
          t.removeAttribute('data-prep-live-track')
        }
      }

      const onPaste = (e: ClipboardEvent) => {
        const t = e.target
        if (!(t instanceof HTMLInputElement)) return
        if (!t.classList.contains('prep-input')) return
        const block = t.closest('.practice-with-check')
        if (!block || block.getAttribute('data-prep-checked') !== 'true') return
        if (!t.hasAttribute('data-prep-live-track')) return
        requestAnimationFrame(() => {
          const outcome = applyPrepInputCheck(t)
          if (outcome === 'correct') {
            t.removeAttribute('data-prep-live-track')
          }
        })
      }

      root.addEventListener('click', onClick)
      root.addEventListener('input', onInput)
      root.addEventListener('paste', onPaste)
      detach = () => {
        root.removeEventListener('click', onClick)
        root.removeEventListener('input', onInput)
        root.removeEventListener('paste', onPaste)
      }
    })

    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content])

  // Aircraft and Aviation opposite-adjective match.
  useEffect(() => {
    const html = resource.content
    if (typeof html !== 'string' || !html.includes('data-ava-adjective-match')) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-ava-adjective-match]') as HTMLElement | null
      if (el) detach = mountAircraftAviationAdjectiveMatch(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content])

  // Aircraft and Aviation verb gap-fill.
  useEffect(() => {
    const html = resource.content
    if (typeof html !== 'string' || !html.includes('data-ava-verbs-mount')) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-ava-verbs-mount]') as HTMLElement | null
      if (el) detach = mountAircraftAviationVerbsGapFill(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content])

  // Army "Instructions and Descriptions" opposite-adjective match (inline <script> in resource HTML does not run in React).
  useEffect(() => {
    const html = resource.content
    if (typeof html !== 'string' || !html.includes('data-ida-adjective-match')) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-ida-adjective-match]') as HTMLElement | null
      if (el) detach = mountInstructionsDescriptionsArmyAdjectiveMatch(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content])

  // Army vocabulary #2: verb → mission scenario gaps.
  useEffect(() => {
    const html = resource.content
    if (typeof html !== 'string' || !html.includes('data-ida-verbs-mount')) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-ida-verbs-mount]') as HTMLElement | null
      if (el) detach = mountInstructionsDescriptionsArmyVerbsMission(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content])

  useLayoutEffect(() => {
    if (!hasVocabGapFill) return
    let detach: (() => void) | undefined
    let cancelled = false

    const tryMount = () => {
      if (cancelled) return
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-vocab-gap-fill-mount]') as HTMLElement | null
      if (!el) return
      detach = mountVocabularySeriesGapFill(el)
    }

    tryMount()
    const rafId = requestAnimationFrame(tryMount)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [hasVocabGapFill, resource.content])

  // Interactive worksheet activities (drag-and-drop, listening, etc.).
  useLayoutEffect(() => {
    if (!hasMountedWorksheetActivities) return
    let detach: (() => void) | undefined
    const giaqCleanups: (() => void)[] = []
    let cancelled = false

    const mountGiaqPanels = () => {
      const host = contentRef.current
      if (!host || !hasGiaqActivities) return
      const added = mountUnmountedGivingInformationActivities(host, giaqPersistenceRef.current ?? undefined)
      giaqCleanups.push(...added)
    }

    const tryMount = () => {
      if (cancelled) return
      const host = contentRef.current
      if (!host) return

      if (hasGiaqActivities) {
        const giaqEls = Array.from(host.querySelectorAll('[data-giaq-match]')) as HTMLElement[]
        const listeningEl = host.querySelector('[data-giaq-listening]') as HTMLElement | null
        const matchesReady =
          giaqEls.length === 0 || giaqEls.every((el) => el.getAttribute('data-giaq-mounted') === 'true')
        const listeningReady =
          !listeningEl || listeningEl.getAttribute('data-giaq-listening-mounted') === 'true'
        if (!matchesReady || !listeningReady) mountGiaqPanels()
        return
      }

      const klEl = host.querySelector('[data-kl-activity]') as HTMLElement | null
      const listeningEl = host.querySelector('[data-listening-activity]') as HTMLElement | null
      const klReady = !klEl || klEl.getAttribute('data-kl-mounted') === 'true'
      const listeningReady = !listeningEl || listeningEl.getAttribute('data-listening-mounted') === 'true'
      if (klReady && listeningReady) return
      detach?.()
      detach = mountPresentingServicesProductsActivities(host)
    }

    tryMount()
    const rafId = requestAnimationFrame(tryMount)

    const host = contentRef.current
    const observer =
      host &&
      new MutationObserver(() => {
        tryMount()
      })
    if (observer && host) {
      observer.observe(host, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      observer?.disconnect()
      giaqCleanups.forEach((fn) => fn())
      detach?.()
    }
  }, [resource.content, hasMountedWorksheetActivities, hasGiaqActivities])

  // Static phrase lists with 🔊 buttons (e.g. Natur'Evasion Vocabulary).
  useLayoutEffect(() => {
    if (!hasPhraseAudioRoot) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-phrase-audio-root]') as HTMLElement | null
      if (el && el.getAttribute('data-phrase-audio-mounted') !== 'true') {
        detach = mountPhraseAudioButtons(el)
      }
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content, hasPhraseAudioRoot])

  // TOEIC writing practice countdown timers (emails + essay).
  useLayoutEffect(() => {
    if (!hasWritingTimers) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      detach = mountWritingPracticeTimers(host)
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content, hasWritingTimers])

  // Past Simple Practice (Army): -ed pronunciation columns.
  useEffect(() => {
    const html = resource.content
    if (typeof html !== 'string' || !html.includes('data-pspa-ed-pronunciation')) return
    let detach: (() => void) | undefined
    const rafId = requestAnimationFrame(() => {
      const host = contentRef.current
      if (!host) return
      const el = host.querySelector('[data-pspa-ed-pronunciation]') as HTMLElement | null
      if (el) detach = mountPastSimpleArmyEdPronunciation(el)
    })
    return () => {
      cancelAnimationFrame(rafId)
      detach?.()
    }
  }, [resource.content])

  // Cleanup: Defer root unmount to avoid "synchronously unmount while React was rendering" warning
  useEffect(() => {
    return () => {
      const content = contentRef.current
      if (!content) return
      const unmountRoots = () => {
        const answerInputs = content.querySelectorAll('[data-answer-input]')
        answerInputs.forEach((container) => {
          const root = (container as any)._reactRoot
          if (root) {
            try {
              root.unmount()
              delete (container as any)._reactRoot
            } catch (e) { /* ignore */ }
          }
        })
        const grammarInputs = content.querySelectorAll('[data-grammar-input]')
        grammarInputs.forEach((container) => {
          const root = (container as any)._reactRoot
          if (root) {
            try {
              root.unmount()
              delete (container as any)._reactRoot
            } catch (e) { /* ignore */ }
          }
        })
      }
      queueMicrotask(unmountRoots) // Defer to avoid sync unmount during render
    }
  }, [resource.content])

  useEffect(() => {
    if (preventSave) return

    const autoSave = setInterval(() => {
      if (notesRef.current && status !== 'NOT_STARTED') {
        saveProgress()
      }
    }, 30000)

    return () => clearInterval(autoSave)
  }, [preventSave, status, saveProgress])

  // Flush and persist when the student leaves the tab or closes the page.
  useEffect(() => {
    if (preventSave) return
    if (!hasGrammarInputs && !hasGiaqActivities && !isPlacementTest) return

    const persistOnLeave = () => {
      const notesValue = hasGrammarInputs
        ? flushGrammarInputsToNotes(false)
        : notesRef.current || notes
      if (!notesValue?.trim() || notesValue.trim() === '{}') return

      const statusToSave = status === 'NOT_STARTED' ? 'IN_PROGRESS' : status
      const payload = JSON.stringify({ notes: notesValue, status: statusToSave })
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(
          `/api/progress/${assignmentId}`,
          new Blob([payload], { type: 'application/json' })
        )
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistOnLeave()
      }
    }

    window.addEventListener('pagehide', persistOnLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', persistOnLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [
    assignmentId,
    flushGrammarInputsToNotes,
    hasGiaqActivities,
    hasGrammarInputs,
    isPlacementTest,
    notes,
    preventSave,
    status,
  ])

  const markComplete = async () => {
    if (preventSave) return
    setSaving(true)
    try {
      const notesValue = hasGrammarInputs ? flushGrammarInputsToNotes(true) : notesRef.current || notes
      const response = await fetch(`/api/progress/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesValue,
          status: 'COMPLETED'
        })
      })

      if (response.ok) {
        setStatus('COMPLETED')
        setSaved(true)
        setShowCompletionModal(true)
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
              .screen-only { display: none !important; }
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

  if (!isClientMounted) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        {!compact && (
          <div className="mb-4 flex items-center gap-4">
            <div className="h-10 w-44 animate-pulse rounded-md bg-gray-100" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-gray-100" />
          </div>
        )}
        <div className="mb-4 min-h-[320px] rounded-lg border bg-white p-6">
          <div className="mb-3 h-4 w-2/3 max-w-md animate-pulse rounded bg-gray-100" />
          <div className="mb-3 h-4 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-5/6 max-w-lg animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {!compact && (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🖨️ Print
          </button>
          {(isPlacementTest || hasGrammarInputs) && (
            <button
              onClick={() => saveProgress()}
              disabled={saving}
              className="px-4 py-2 text-white rounded-md disabled:opacity-50"
              style={{ backgroundColor: '#38438f' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#2d3569')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#38438f')}
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Answers'}
            </button>
          )}
        </div>
        {status === 'COMPLETED' && (
          <span className="text-green-600 font-medium">✓ Completed</span>
        )}
      </div>
      )}

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
              if (placementHtmlSplit) {
                return (
                  <>
                    <MemoizedContent
                      key="content-before-writing"
                      html={placementHtmlSplit.before}
                    />
                    <div style={{ marginTop: '15px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 600,
                          marginBottom: '8px',
                          color: '#000',
                        }}
                      >
                        Your Response:
                      </label>
                      <PlacementWritingTextarea
                        key="placement-writing-textarea"
                        value={writingAnswerValue}
                        onChange={handlePlacementWritingChange}
                      />
                      <MemoizedContent key="content-after-writing" html={placementHtmlSplit.after} />
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
              // Render normally for non-placement tests
              // Memoize HTML when it has injected inputs/activities (re-renders would reset the DOM).
              if (hasGrammarInputs || hasMountedWorksheetActivities) {
                return (
                  <MemoizedContent html={resource.content} fullWidth={hasMountedWorksheetActivities} />
                )
              }
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

      {!compact && status !== 'COMPLETED' && (
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

      {showStudentNotice && !compact && (
        <div className="mt-4 text-sm text-gray-500">
          <p>⚠️ This worksheet is unique to you. Do not share the link with anyone.</p>
        </div>
      )}

      {/* Resource Timestamps */}
      {(resource.createdAt || resource.updatedAt) && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          {resource.createdAt && (
            <span>Resource created: {new Date(resource.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          )}
          {resource.createdAt && resource.updatedAt && <span> / </span>}
          {resource.updatedAt && (
            <span>Resource last updated: {new Date(resource.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          )}
        </div>
      )}

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

