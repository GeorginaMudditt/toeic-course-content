'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatUKDate } from '@/lib/date-utils'
import { listOnboardingTemplateVariants } from '@/lib/onboarding-templates'
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

function getAcceptAttribute(allowedMimeTypes?: string[]) {
  if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
    return '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'
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

function getWorkflowSectionCopy(item: OnboardingChecklistItemView) {
  if (item.type === 'language-assessment') {
    return {
      title: 'Option B — Pre-enrollment assessment',
      description:
        'Follow these steps in order. You can still upload a certificate above at any time instead.',
      showConventionReminder: false,
    }
  }

  if (item.slug === 'end-of-course-certificate') {
    return {
      title: 'End-of-course certificate',
      description:
        "Make a copy of the template, complete it with the student's details, then send for signature and upload the signed PDF.",
      showConventionReminder: false,
    }
  }

  return {
    title: 'Convention or Contract',
    description: 'Choose the correct template, then complete and upload the signed PDF.',
    showConventionReminder: true,
  }
}

export default function LanguageAssessmentChecklistCard({
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
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)

  const isUploaded = item.linkedDocument !== null
  const workflow = item.workflowState ?? {}
  const templateVariants = listOnboardingTemplateVariants(item.slug)
  const workflowSection = getWorkflowSectionCopy(item)
  const showCertificateOption = item.type === 'language-assessment'
  const signedUploadLabel =
    item.type === 'convention-contract' ? 'Upload signed document' : 'Upload signed form'

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

  const handleMakeTemplateCopy = async (variantKey: string) => {
    setIsDownloadingTemplate(true)
    onError(null)

    try {
      const response = await fetch(
        `/api/onboarding-templates/${item.slug}?variant=${encodeURIComponent(variantKey)}`
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to create template copy')
        return
      }

      window.open(data.copyUrl as string, '_blank', 'noopener,noreferrer')

      await patchChecklist({
        workflowUpdate: 'templateDownloaded',
        templateVariant: variantKey,
      })
    } catch {
      onError('Failed to create template copy. Check your connection and try again.')
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleDownloadTemplateAsWord = async (variantKey: string) => {
    setIsDownloadingTemplate(true)
    onError(null)

    try {
      const response = await fetch(
        `/api/onboarding-templates/${item.slug}?variant=${encodeURIComponent(variantKey)}`
      )
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        onError(typeof data.error === 'string' ? data.error : 'Failed to download template')
        return
      }

      window.open(data.downloadUrl as string, '_blank', 'noopener,noreferrer')

      await patchChecklist({
        workflowUpdate: 'templateDownloaded',
        templateVariant: variantKey,
      })
    } catch {
      onError('Failed to download template. Check your connection and try again.')
    } finally {
      setIsDownloadingTemplate(false)
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
                <div className="mt-4 space-y-4">
                  {showCertificateOption && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-900">
                        Option A — Recent language certificate
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Upload the certificate directly (PDF or image). No other steps required.
                      </p>
                      {panelMode !== 'upload' && (
                        <button
                          type="button"
                          onClick={openUploadPanel}
                          className="mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569]"
                          style={{ backgroundColor: '#38438f' }}
                        >
                          Upload certificate
                        </button>
                      )}
                    </div>
                  )}

                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-sm font-medium text-gray-900">{workflowSection.title}</p>
                    <p className="mt-1 text-xs text-gray-600">{workflowSection.description}</p>

                    {workflowSection.showConventionReminder && (
                      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <span className="font-medium">Reminder:</span> use{' '}
                        <span className="font-medium">Convention</span> for financed training; use{' '}
                        <span className="font-medium">Contract</span> for self-financed training.
                      </p>
                    )}

                    <ol className="mt-3 space-y-3">
                      <li className="flex flex-col gap-2">
                        <div>
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">1.</span> Make a copy of the template
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Opens a new Google Doc in your Drive — the master template stays blank.
                            Fill in this student&apos;s details in the copy.
                          </p>
                          {workflow.templateDownloadedAt && (
                            <p className="mt-0.5 text-xs text-emerald-700">
                              Copy started {formatUKDate(workflow.templateDownloadedAt)}
                              {workflow.templateVariantLabel
                                ? ` (${workflow.templateVariantLabel})`
                                : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {templateVariants.map((variant) => (
                            <div key={variant.key} className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleMakeTemplateCopy(variant.key)}
                                disabled={isDownloadingTemplate || isSaving}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                                style={{ backgroundColor: '#38438f' }}
                              >
                                {isDownloadingTemplate
                                  ? 'Opening…'
                                  : templateVariants.length === 1
                                    ? 'Make a copy'
                                    : `Make a copy — ${variant.label}`}
                              </button>
                              {showCertificateOption && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadTemplateAsWord(variant.key)}
                                  disabled={isDownloadingTemplate || isSaving}
                                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Download {variant.label} as Word
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </li>

                      <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">2.</span> Complete in Word and send via
                            DocuSign
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Fill in the student&apos;s details, then send for signature outside this
                            app.
                          </p>
                          {workflow.formPreparedAt && (
                            <p className="mt-0.5 text-xs text-emerald-700">
                              Marked prepared {formatUKDate(workflow.formPreparedAt)}
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
                            <span className="font-medium">3.</span> {signedUploadLabel}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Return here after DocuSign to upload the completed PDF.
                          </p>
                        </div>
                        {panelMode !== 'upload' && (
                          <button
                            type="button"
                            onClick={openUploadPanel}
                            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569]"
                            style={{ backgroundColor: '#38438f' }}
                          >
                            {signedUploadLabel}
                          </button>
                        )}
                      </li>
                    </ol>

                    {(workflow.templateDownloadedAt || workflow.formPreparedAt) && (
                      <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
                        <StepIndicator
                          done={Boolean(workflow.templateDownloadedAt)}
                          label="Copy created"
                        />
                        <StepIndicator
                          done={Boolean(workflow.formPreparedAt)}
                          label="Sent for signature"
                        />
                      </div>
                    )}
                  </div>
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
            {isUploaded ? 'Replace document' : 'Upload document'}
          </label>
          <p className="mb-2 text-xs text-gray-500">
            PDF or image. Appears on the student&apos;s My Docs page as &quot;
            {item.documentTitle}&quot;.
          </p>
          <input
            id={`file-${item.slug}`}
            type="file"
            accept={getAcceptAttribute(item.allowedMimeTypes)}
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
