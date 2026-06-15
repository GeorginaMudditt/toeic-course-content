'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatUKDate } from '@/lib/date-utils'
import type { OnboardingChecklistItemView } from '@/lib/student-onboarding-checklist'

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024

type Props = {
  item: OnboardingChecklistItemView
  studentId: string
  index: number
  onError: (message: string | null) => void
  onItemUpdate: (item: OnboardingChecklistItemView) => void
}

type PanelMode = 'upload' | 'note' | null

function StepIndicator({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        done ? 'text-emerald-700' : 'text-gray-500'
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
          done ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {done ? '✓' : '·'}
      </span>
      {label}
    </span>
  )
}

export default function PdfWorkflowChecklistCard({
  item,
  studentId,
  index,
  onError,
  onItemUpdate,
}: Props) {
  const router = useRouter()
  const [panelMode, setPanelMode] = useState<PanelMode>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [fileDraft, setFileDraft] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const isUploaded = item.linkedDocument !== null
  const workflow = item.workflowState ?? {}

  const closePanel = () => {
    setPanelMode(null)
    setNoteDraft('')
    setFileDraft(null)
  }

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

  const handleDownloadDocument = async () => {
    setIsDownloading(true)
    onError(null)

    try {
      const response = await fetch(`/api/onboarding-downloads/${item.slug}`)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to download document')
        return
      }

      const link = document.createElement('a')
      link.href = data.downloadUrl as string
      link.download = (data.fileName as string) || 'document.pdf'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      await patchChecklist({ workflowUpdate: 'templateDownloaded' })
    } catch {
      onError('Failed to download document. Check your connection and try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleMarkFormPrepared = async () => {
    const success = await patchChecklist({ workflowUpdate: 'formPrepared' })
    if (success) {
      closePanel()
    }
  }

  const handleUpload = async () => {
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

      closePanel()
      router.refresh()
    } catch {
      onError('Failed to upload document. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNote = async () => {
    const documentId = item.linkedDocument?.id
    if (!documentId) {
      onError('Upload a document before adding a note')
      return
    }

    setIsSaving(true)
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

      closePanel()
      router.refresh()
    } catch {
      onError('Failed to save note. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const openUploadPanel = () => {
    onError(null)
    setPanelMode('upload')
    setFileDraft(null)
  }

  const openNotePanel = () => {
    onError(null)
    setPanelMode('note')
    setNoteDraft(item.note ?? '')
    setFileDraft(null)
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

              {isUploaded && item.fileUrl && item.fileName && (
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

              {!isUploaded && (
                <div className="mt-4 rounded-md border border-gray-200 p-3">
                  <p className="text-sm font-medium text-gray-900">CGV &amp; Règlement Intérieur</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Download the document, send via DocuSign, then upload the signed PDF.
                  </p>

                  <ol className="mt-3 space-y-3">
                    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">1.</span> Download the document
                        </p>
                        {workflow.templateDownloadedAt && (
                          <p className="mt-0.5 text-xs text-emerald-700">
                            Downloaded {formatUKDate(workflow.templateDownloadedAt)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadDocument}
                        disabled={isDownloading || isSaving}
                        className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                        style={{ backgroundColor: '#38438f' }}
                      >
                        {isDownloading ? 'Downloading…' : 'Download document'}
                      </button>
                    </li>

                    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">2.</span> Send via DocuSign
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Send the downloaded PDF for signature outside this app.
                        </p>
                        {workflow.formPreparedAt && (
                          <p className="mt-0.5 text-xs text-emerald-700">
                            Marked sent {formatUKDate(workflow.formPreparedAt)}
                          </p>
                        )}
                      </div>
                      {!workflow.formPreparedAt && (
                        <button
                          type="button"
                          onClick={handleMarkFormPrepared}
                          disabled={isSaving}
                          className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          Mark as sent for signature
                        </button>
                      )}
                    </li>

                    <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">3.</span> Upload the signed document
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Return here after DocuSign to upload the signed PDF.
                        </p>
                      </div>
                      {panelMode !== 'upload' && (
                        <button
                          type="button"
                          onClick={openUploadPanel}
                          className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569]"
                          style={{ backgroundColor: '#38438f' }}
                        >
                          Upload signed document
                        </button>
                      )}
                    </li>
                  </ol>

                  {(workflow.templateDownloadedAt || workflow.formPreparedAt) && (
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
                      <StepIndicator
                        done={Boolean(workflow.templateDownloadedAt)}
                        label="Document downloaded"
                      />
                      <StepIndicator
                        done={Boolean(workflow.formPreparedAt)}
                        label="Sent for signature"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isUploaded && panelMode === null && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={openNotePanel}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {item.note ? 'Edit note' : 'Add note'}
            </button>
            <button
              type="button"
              onClick={openUploadPanel}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Replace
            </button>
          </div>
        )}
      </div>

      {panelMode === 'upload' && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <label
            htmlFor={`file-${item.slug}`}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {isUploaded ? 'Replace document' : 'Upload signed document'}
          </label>
          <p className="mb-2 text-xs text-gray-500">
            PDF only. Appears on the student&apos;s My Docs page as &quot;{item.documentTitle}
            &quot;.
          </p>
          <input
            id={`file-${item.slug}`}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFileDraft(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#e8eaf6] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#38438f] hover:file:bg-[#d8dcf0]"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isSaving || !fileDraft}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
              style={{ backgroundColor: '#38438f' }}
            >
              {isSaving ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={closePanel}
              disabled={isSaving}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {panelMode === 'note' && (
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
              disabled={isSaving}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
              style={{ backgroundColor: '#38438f' }}
            >
              {isSaving ? 'Saving…' : 'Save note'}
            </button>
            <button
              type="button"
              onClick={closePanel}
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
}
