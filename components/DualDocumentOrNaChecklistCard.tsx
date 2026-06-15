'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatUKDate } from '@/lib/date-utils'
import type { ChecklistDocumentSlot, OnboardingChecklistItemView } from '@/lib/student-onboarding-checklist'

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024

type Props = {
  item: OnboardingChecklistItemView
  studentId: string
  index: number
  onError: (message: string | null) => void
  onItemUpdate: (item: OnboardingChecklistItemView) => void
}

function getAcceptAttribute(allowedMimeTypes?: string[]) {
  if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
    return '.pdf,application/pdf'
  }

  return allowedMimeTypes
    .map((mimeType) => {
      if (mimeType === 'application/pdf') return '.pdf,application/pdf'
      if (mimeType === 'image/png') return '.png,image/png'
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg,.jpeg,image/jpeg'
      return mimeType
    })
    .join(',')
}

export default function DualDocumentOrNaChecklistCard({
  item,
  studentId,
  index,
  onError,
  onItemUpdate,
}: Props) {
  const router = useRouter()
  const [uploadSlotKey, setUploadSlotKey] = useState<string | null>(null)
  const [fileDraft, setFileDraft] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const slots = item.documentSlots ?? []
  const isNotApplicable = item.status === 'NOT_APPLICABLE'
  const isComplete = item.status === 'COMPLETED'
  const uploadedCount = Object.keys(item.linkedDocumentsBySlot).length
  const totalSlots = slots.length

  const patchChecklist = async (payload: Record<string, unknown>) => {
    setIsSaving(true)
    onError(null)

    try {
      const response = await fetch(`/api/students/${studentId}/onboarding-checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemSlug: item.slug, ...payload }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to update checklist')
        return false
      }

      if (data.item) {
        onItemUpdate(data.item)
      }

      router.refresh()
      return true
    } catch {
      onError('Failed to update checklist. Check your connection and try again.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkNotApplicable = async () => {
    const success = await patchChecklist({ status: 'NOT_APPLICABLE' })
    if (success) {
      setUploadSlotKey(null)
      setFileDraft(null)
    }
  }

  const handleUndo = async () => {
    const success = await patchChecklist({ status: 'PENDING' })
    if (success) {
      setUploadSlotKey(null)
      setFileDraft(null)
    }
  }

  const openUploadPanel = (slot: ChecklistDocumentSlot) => {
    onError(null)
    setUploadSlotKey(slot.key)
    setFileDraft(null)
  }

  const closeUploadPanel = () => {
    setUploadSlotKey(null)
    setFileDraft(null)
  }

  const handleUpload = async (slot: ChecklistDocumentSlot) => {
    if (!fileDraft) {
      onError('Please choose a file to upload')
      return
    }

    const allowedMimeTypes = item.allowedMimeTypes ?? ['application/pdf']
    if (!allowedMimeTypes.includes(fileDraft.type)) {
      onError('Invalid file type for this item')
      return
    }

    if (fileDraft.size > MAX_UPLOAD_SIZE_BYTES) {
      onError('File size exceeds limit (25MB)')
      return
    }

    setIsSaving(true)
    onError(null)

    try {
      const uploadUrlResponse = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          fileName: fileDraft.name,
          mimeType: fileDraft.type,
          fileSize: fileDraft.size,
        }),
      })

      if (!uploadUrlResponse.ok) {
        const uploadError = await uploadUrlResponse.json().catch(() => ({}))
        onError(
          typeof uploadError.error === 'string'
            ? uploadError.error
            : 'Failed to prepare file upload'
        )
        return
      }

      const uploadUrlData = await uploadUrlResponse.json()
      const filePath = uploadUrlData.filePath as string
      const token = uploadUrlData.token as string

      const { error: storageError } = await supabase.storage
        .from('resources')
        .uploadToSignedUrl(filePath, token, fileDraft)

      if (storageError) {
        onError(storageError.message || 'Failed to upload file')
        return
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          checklistItemSlug: item.slug,
          checklistDocumentKey: slot.key,
          fileName: fileDraft.name,
          filePath,
          fileSize: fileDraft.size,
          mimeType: fileDraft.type,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to save document')
        return
      }

      closeUploadPanel()
      router.refresh()
    } catch {
      onError('Failed to upload document. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isResolved = isComplete || isNotApplicable

  return (
    <li
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        isNotApplicable
          ? 'border-slate-200 bg-slate-50'
          : isComplete
            ? 'border-emerald-200'
            : 'border-gray-200'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isResolved
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isResolved ? '✓' : index + 1}
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-medium sm:text-base ${
                  isNotApplicable ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {item.label}
              </p>

              {isNotApplicable && (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Not applicable
                </p>
              )}

              {isComplete && item.completedAt && (
                <p className="mt-2 text-sm text-emerald-700">
                  Completed on {formatUKDate(item.completedAt)}
                </p>
              )}

              {!isNotApplicable && !isComplete && (
                <p className="mt-2 text-sm text-gray-600">
                  {uploadedCount} of {totalSlots} documents uploaded
                </p>
              )}

              {!isNotApplicable && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-900">Upload documents</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Upload both documents below. They will appear on the student&apos;s My Docs
                      page.
                    </p>

                    <ul className="mt-3 space-y-3">
                      {slots.map((slot) => {
                        const linked = item.linkedDocumentsBySlot[slot.key]
                        const isUploadingThis = uploadSlotKey === slot.key

                        return (
                          <li
                            key={slot.key}
                            className="rounded-md border border-gray-200 bg-white p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800">{slot.label}</p>
                                {linked && (
                                  <>
                                    <p className="mt-0.5 text-xs text-emerald-700">
                                      Uploaded {formatUKDate(linked.createdAt)}
                                    </p>
                                    <a
                                      href={linked.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-1 inline-block text-sm font-medium text-[#38438f] hover:text-[#2d3569]"
                                    >
                                      View document
                                    </a>
                                  </>
                                )}
                              </div>

                              {!isComplete && !isUploadingThis && (
                                <button
                                  type="button"
                                  onClick={() => openUploadPanel(slot)}
                                  disabled={isSaving}
                                  className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                                >
                                  {linked ? 'Replace' : 'Upload'}
                                </button>
                              )}

                              {isComplete && linked && (
                                <button
                                  type="button"
                                  onClick={() => openUploadPanel(slot)}
                                  disabled={isSaving}
                                  className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Replace
                                </button>
                              )}
                            </div>

                            {isUploadingThis && (
                              <div className="mt-3 border-t border-gray-100 pt-3">
                                <input
                                  id={`file-${item.slug}-${slot.key}`}
                                  type="file"
                                  accept={getAcceptAttribute(item.allowedMimeTypes)}
                                  onChange={(e) => setFileDraft(e.target.files?.[0] ?? null)}
                                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#e8eaf6] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#38438f] hover:file:bg-[#d8dcf0]"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpload(slot)}
                                    disabled={isSaving || !fileDraft}
                                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                                    style={{ backgroundColor: '#38438f' }}
                                  >
                                    {isSaving ? 'Uploading…' : 'Upload'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={closeUploadPanel}
                                    disabled={isSaving}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {isComplete && (
                <ul className="mt-3 space-y-2">
                  {slots.map((slot) => {
                    const linked = item.linkedDocumentsBySlot[slot.key]
                    if (!linked) return null
                    return (
                      <li key={slot.key} className="text-sm text-gray-700">
                        <span className="font-medium">{slot.label}:</span>{' '}
                        <a
                          href={linked.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#38438f] hover:text-[#2d3569]"
                        >
                          {linked.fileName}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {!isResolved && (
            <button
              type="button"
              onClick={handleMarkNotApplicable}
              disabled={isSaving}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              N/A
            </button>
          )}

          {isResolved && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isSaving}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Undo
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
