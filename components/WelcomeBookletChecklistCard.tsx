'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatUKDate } from '@/lib/date-utils'
import type { OnboardingChecklistItemView } from '@/lib/student-onboarding-checklist'

type Props = {
  item: OnboardingChecklistItemView
  studentId: string
  index: number
  onError: (message: string | null) => void
  onItemUpdate: (item: OnboardingChecklistItemView) => void
}

function resolveSelectedOption(item: OnboardingChecklistItemView) {
  const options = item.templatePickOptions ?? []
  const byWorkflowKey = options.find(
    (option) => option.key === item.workflowState?.selectedVariant
  )
  if (byWorkflowKey) {
    return {
      key: byWorkflowKey.key,
      label: item.workflowState?.selectedVariantLabel ?? byWorkflowKey.label,
    }
  }

  const fileName = item.linkedDocument?.fileName ?? ''
  const byFileName = options.find((option) => fileName.includes(option.label))
  if (byFileName) {
    return { key: byFileName.key, label: byFileName.label }
  }

  if (item.workflowState?.selectedVariantLabel) {
    return {
      key: item.workflowState.selectedVariant ?? null,
      label: item.workflowState.selectedVariantLabel,
    }
  }

  return null
}

export default function WelcomeBookletChecklistCard({
  item,
  studentId,
  index,
  onError,
  onItemUpdate,
}: Props) {
  const router = useRouter()
  const [publishingKey, setPublishingKey] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [showNotePanel, setShowNotePanel] = useState(false)
  const [showChangePanel, setShowChangePanel] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)

  const isUploaded = item.linkedDocument !== null
  const options = item.templatePickOptions ?? []
  const selected = resolveSelectedOption(item)
  const showPicker = !isUploaded || showChangePanel

  const handlePublish = async (templateKey: string) => {
    setPublishingKey(templateKey)
    onError(null)

    try {
      const response = await fetch('/api/onboarding-templates/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          checklistItemSlug: item.slug,
          templateKey,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to publish welcome booklet')
        return
      }

      if (data.item) {
        onItemUpdate(data.item)
      }

      setShowChangePanel(false)
      router.refresh()
    } catch {
      onError('Failed to publish welcome booklet. Check your connection and try again.')
    } finally {
      setPublishingKey(null)
    }
  }

  const handleSaveNote = async () => {
    const documentId = item.linkedDocument?.id
    if (!documentId) {
      onError('Publish a welcome booklet before adding a note')
      return
    }

    setIsSavingNote(true)
    onError(null)

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNote: noteDraft }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to save note')
        return
      }

      setShowNotePanel(false)
      router.refresh()
    } catch {
      onError('Failed to save note. Check your connection and try again.')
    } finally {
      setIsSavingNote(false)
    }
  }

  const openNotePanel = () => {
    onError(null)
    setNoteDraft(item.note ?? '')
    setShowNotePanel(true)
    setShowChangePanel(false)
  }

  return (
    <li
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        isUploaded ? 'border-emerald-200' : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isUploaded ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isUploaded ? '✓' : index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 sm:text-base">{item.label}</p>

              {isUploaded && item.completedAt && (
                <p className="mt-2 text-sm text-emerald-700">
                  Uploaded on {formatUKDate(item.completedAt)}
                </p>
              )}

              {isUploaded && selected && !showChangePanel && (
                <p className="mt-1 text-sm text-gray-800">
                  <span className="font-medium">Version:</span> {selected.label}
                </p>
              )}

              {isUploaded && item.fileUrl && (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-medium text-[#38438f] hover:text-[#2d3569]"
                >
                  View document
                </a>
              )}

              {isUploaded && item.note && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{item.note}</p>
              )}

              {showPicker && (
                <div className="mt-4 rounded-md border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {isUploaded ? 'Choose a different welcome booklet' : 'Choose a welcome booklet'}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {isUploaded
                      ? 'Select a new version if the student’s course type has changed.'
                      : `Select the booklet that matches this student’s course. It will appear on their My Docs page as "${item.documentTitle}".`}
                  </p>

                  <ul className="mt-3 space-y-2">
                    {options.map((option) => {
                      const isCurrent = selected?.key === option.key
                      const isPublishing = publishingKey === option.key

                      return (
                        <li
                          key={option.key}
                          className={`flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
                            isCurrent ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{option.label}</p>
                            {isCurrent && isUploaded && (
                              <p className="mt-0.5 text-xs text-emerald-700">Current version</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePublish(option.key)}
                            disabled={publishingKey !== null}
                            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                              isUploaded
                                ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                : 'text-white hover:bg-[#2d3569]'
                            }`}
                            style={isUploaded ? undefined : { backgroundColor: '#38438f' }}
                          >
                            {isPublishing ? 'Uploading…' : isUploaded ? 'Switch to this' : 'Upload'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  {isUploaded && (
                    <button
                      type="button"
                      onClick={() => setShowChangePanel(false)}
                      disabled={publishingKey !== null}
                      className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isUploaded && !showNotePanel && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={openNotePanel}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {item.note ? 'Edit note' : 'Add note'}
            </button>
            {!showChangePanel && (
              <button
                type="button"
                onClick={() => {
                  setShowChangePanel(true)
                  setShowNotePanel(false)
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Change booklet
              </button>
            )}
          </div>
        )}
      </div>

      {showNotePanel && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <label
            htmlFor={`student-note-${item.slug}`}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Note for student
          </label>
          <p className="mb-2 text-xs text-gray-500">
            This note will be visible to the student on their My Docs page.
          </p>
          <textarea
            id={`student-note-${item.slug}`}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
            placeholder="Add a message or instructions for the student"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={isSavingNote}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
              style={{ backgroundColor: '#38438f' }}
            >
              {isSavingNote ? 'Saving…' : 'Save note'}
            </button>
            <button
              type="button"
              onClick={() => setShowNotePanel(false)}
              disabled={isSavingNote}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
