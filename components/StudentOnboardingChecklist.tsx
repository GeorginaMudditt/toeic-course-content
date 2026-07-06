'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatUKDate } from '@/lib/date-utils'
import {
  resolveChecklistExternalLink,
  type OnboardingChecklistItemView,
} from '@/lib/student-onboarding-checklist'
import LanguageAssessmentChecklistCard from '@/components/LanguageAssessmentChecklistCard'
import DualDocumentOrNaChecklistCard from '@/components/DualDocumentOrNaChecklistCard'
import PdfWorkflowChecklistCard from '@/components/PdfWorkflowChecklistCard'
import WelcomeBookletChecklistCard from '@/components/WelcomeBookletChecklistCard'

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024

type Props = {
  studentId: string
  initialItems: OnboardingChecklistItemView[]
}

function getAcceptAttribute(allowedMimeTypes?: string[]) {
  if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
    return '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'
  }

  const extensions = allowedMimeTypes.map((mimeType) => {
    if (mimeType === 'application/pdf') return '.pdf,application/pdf'
    if (mimeType === 'image/png') return '.png,image/png'
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg,.jpeg,image/jpeg'
    return mimeType
  })

  return extensions.join(',')
}

type ExpandedMode = 'upload' | 'note' | 'complete'

export default function StudentOnboardingChecklist({
  studentId,
  initialItems,
}: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [expandedMode, setExpandedMode] = useState<ExpandedMode | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [fileDraft, setFileDraft] = useState<File | null>(null)
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const progress = useMemo(() => {
    const completed = items.filter((item) => item.status === 'COMPLETED').length
    const notApplicable = items.filter((item) => item.status === 'NOT_APPLICABLE').length
    const resolved = completed + notApplicable
    return { completed, notApplicable, resolved, total: items.length }
  }, [items])

  const resetDraft = () => {
    setExpandedSlug(null)
    setExpandedMode(null)
    setNoteDraft('')
    setFileDraft(null)
  }

  const openCompleteForm = (item: OnboardingChecklistItemView) => {
    setError(null)
    setExpandedSlug(item.slug)
    setExpandedMode('complete')
    setNoteDraft(item.note ?? '')
    setFileDraft(null)
  }

  const openUploadForm = (item: OnboardingChecklistItemView) => {
    setError(null)
    setExpandedSlug(item.slug)
    setExpandedMode('upload')
    setFileDraft(null)
  }

  const openNoteForm = (item: OnboardingChecklistItemView) => {
    setError(null)
    setExpandedSlug(item.slug)
    setExpandedMode('note')
    setNoteDraft(item.note ?? '')
    setFileDraft(null)
  }

  const updateItem = async (itemSlug: string, payload: Record<string, unknown>) => {
    setSavingSlug(itemSlug)
    setError(null)

    try {
      const response = await fetch(`/api/students/${studentId}/onboarding-checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemSlug, ...payload }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to update checklist'
        setError(message)
        return false
      }

      if (data.item) {
        setItems((prev) => prev.map((item) => (item.slug === itemSlug ? data.item : item)))
      }

      router.refresh()
      return true
    } catch {
      setError('Failed to update checklist. Check your connection and try again.')
      return false
    } finally {
      setSavingSlug(null)
    }
  }

  const handleMarkNotApplicable = async (itemSlug: string) => {
    const success = await updateItem(itemSlug, { status: 'NOT_APPLICABLE', clearFile: true })
    if (success) {
      resetDraft()
    }
  }

  const handleReset = async (itemSlug: string) => {
    const success = await updateItem(itemSlug, { status: 'PENDING', clearFile: true })
    if (success) {
      resetDraft()
    }
  }

  const handleSaveComplete = async (item: OnboardingChecklistItemView) => {
    setSavingSlug(item.slug)
    setError(null)

    try {
      let filePayload: Record<string, unknown> = {}

      if (fileDraft) {
        if (fileDraft.size > MAX_UPLOAD_SIZE_BYTES) {
          setError('File size exceeds limit (25MB)')
          setSavingSlug(null)
          return
        }

        const uploadUrlResponse = await fetch(
          `/api/students/${studentId}/onboarding-checklist/upload-url`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemSlug: item.slug,
              fileName: fileDraft.name,
              mimeType: fileDraft.type,
              fileSize: fileDraft.size,
            }),
          }
        )

        if (!uploadUrlResponse.ok) {
          const uploadError = await uploadUrlResponse.json().catch(() => ({}))
          setError(
            typeof uploadError.error === 'string'
              ? uploadError.error
              : 'Failed to prepare file upload'
          )
          setSavingSlug(null)
          return
        }

        const uploadUrlData = await uploadUrlResponse.json()
        const filePath = uploadUrlData.filePath as string
        const token = uploadUrlData.token as string

        const { error: storageError } = await supabase.storage
          .from('resources')
          .uploadToSignedUrl(filePath, token, fileDraft)

        if (storageError) {
          setError(storageError.message || 'Failed to upload file')
          setSavingSlug(null)
          return
        }

        filePayload = {
          fileName: fileDraft.name,
          filePath,
          fileSize: fileDraft.size,
          mimeType: fileDraft.type,
        }
      }

      const success = await updateItem(item.slug, {
        status: 'COMPLETED',
        note: noteDraft,
        ...filePayload,
      })

      if (success) {
        resetDraft()
      }
    } finally {
      setSavingSlug(null)
    }
  }

  const handleStudentDocumentUpload = async (item: OnboardingChecklistItemView) => {
    if (!fileDraft) {
      setError('Please choose a file to upload')
      return
    }

    const allowedMimeTypes = item.allowedMimeTypes ?? ['application/pdf']
    if (!allowedMimeTypes.includes(fileDraft.type)) {
      setError('Invalid file type for this item')
      return
    }

    if (fileDraft.size > MAX_UPLOAD_SIZE_BYTES) {
      setError('File size exceeds limit (25MB)')
      return
    }

    setSavingSlug(item.slug)
    setError(null)

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
        setError(
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
        setError(storageError.message || 'Failed to upload file')
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
        setError(typeof data.error === 'string' ? data.error : 'Failed to save document')
        return
      }

      resetDraft()
      router.refresh()
    } catch {
      setError('Failed to upload document. Check your connection and try again.')
    } finally {
      setSavingSlug(null)
    }
  }

  const handleSaveCompleteOrNaNote = async (item: OnboardingChecklistItemView) => {
    const success = await updateItem(item.slug, { status: 'COMPLETED', note: noteDraft })
    if (success) {
      resetDraft()
    }
  }

  const handleSaveStudentDocumentNote = async (item: OnboardingChecklistItemView) => {
    const documentId = item.linkedDocument?.id
    if (!documentId) {
      setError('Upload a document before adding a note')
      return
    }

    setSavingSlug(item.slug)
    setError(null)

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentNote: noteDraft }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to save note')
        return
      }

      resetDraft()
      router.refresh()
    } catch {
      setError('Failed to save note. Check your connection and try again.')
    } finally {
      setSavingSlug(null)
    }
  }

  const renderStatusBadge = (
    item: OnboardingChecklistItemView,
    index: number,
    isUploaded: boolean,
    isNotApplicable: boolean
  ) => {
    const isResolved = isUploaded || isNotApplicable

    return (
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isResolved ? '✓' : index + 1}
      </span>
    )
  }

  return (
    <div>
      <p className="mb-6 text-sm text-gray-600">
        {progress.resolved} of {progress.total} items resolved
        {progress.completed > 0 ? ` (${progress.completed} completed` : ''}
        {progress.completed > 0 && progress.notApplicable > 0 ? ', ' : ''}
        {progress.notApplicable > 0 ? `${progress.notApplicable} N/A` : ''}
        {progress.completed > 0 || progress.notApplicable > 0 ? ')' : ''}
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item, index) => {
          if (item.type === 'language-assessment' || item.type === 'convention-contract') {
            return (
              <LanguageAssessmentChecklistCard
                key={item.slug}
                item={item}
                studentId={studentId}
                index={index}
                onError={setError}
                onItemUpdate={(updated) =>
                  setItems((prev) =>
                    prev.map((entry) => (entry.slug === updated.slug ? updated : entry))
                  )
                }
              />
            )
          }

          if (item.type === 'template-pick-upload') {
            return (
              <WelcomeBookletChecklistCard
                key={item.slug}
                item={item}
                studentId={studentId}
                index={index}
                onError={setError}
                onItemUpdate={(updated) =>
                  setItems((prev) =>
                    prev.map((entry) => (entry.slug === updated.slug ? updated : entry))
                  )
                }
              />
            )
          }

          if (item.type === 'pdf-workflow-document') {
            return (
              <PdfWorkflowChecklistCard
                key={item.slug}
                item={item}
                studentId={studentId}
                index={index}
                onError={setError}
                onItemUpdate={(updated) =>
                  setItems((prev) =>
                    prev.map((entry) => (entry.slug === updated.slug ? updated : entry))
                  )
                }
              />
            )
          }

          if (item.type === 'dual-document-or-na') {
            return (
              <DualDocumentOrNaChecklistCard
                key={item.slug}
                item={item}
                studentId={studentId}
                index={index}
                onError={setError}
                onItemUpdate={(updated) =>
                  setItems((prev) =>
                    prev.map((entry) => (entry.slug === updated.slug ? updated : entry))
                  )
                }
              />
            )
          }

          const isExpanded = expandedSlug === item.slug
          const isSaving = savingSlug === item.slug
          const isStudentDocument = item.type === 'student-document'
          const isUploaded = isStudentDocument
            ? item.linkedDocument !== null
            : item.status === 'COMPLETED'
          const isNotApplicable = item.status === 'NOT_APPLICABLE'
          const showUploadPanel = isExpanded && isStudentDocument && expandedMode === 'upload'
          const showStudentDocNotePanel = isExpanded && isStudentDocument && expandedMode === 'note'
          const isCompleteOrNa = item.type === 'complete-or-na'
          const showNotApplicable = isCompleteOrNa && item.allowNotApplicable !== false
          const isNoteOnlyComplete = isCompleteOrNa && item.completeNoteOnly === true
          const showCompleteOrNaNotePanel =
            isExpanded && isCompleteOrNa && expandedMode === 'note'
          const showCompletePanel = isExpanded && isCompleteOrNa && expandedMode === 'complete'
          const externalLink = resolveChecklistExternalLink(item)

          return (
            <li
              key={item.slug}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                isNotApplicable
                  ? 'border-slate-200 bg-slate-50'
                  : isUploaded
                    ? 'border-emerald-200'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    {renderStatusBadge(item, index, isUploaded, isNotApplicable)}
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium sm:text-base ${
                          isNotApplicable ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                      >
                        {item.label}
                      </p>

                      {item.slug === 'setup-e-learning-platform' && !isNotApplicable && (
                        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          <span className="font-medium">Reminder:</span> don&apos;t forget to link to
                          the{' '}
                          <a
                            href="https://www.loom.com/share/0946ac5a9c3c42389b23414d242653bb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline hover:text-amber-950"
                          >
                            Loom video
                          </a>
                          .
                        </p>
                      )}

                      {isStudentDocument && isUploaded && item.completedAt && (
                        <p className="mt-2 text-sm text-emerald-700">
                          Uploaded on {formatUKDate(item.completedAt)}
                        </p>
                      )}

                      {isStudentDocument && isUploaded && item.fileUrl && item.fileName && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-sm font-medium text-[#38438f] hover:text-[#2d3569]"
                        >
                          View document
                        </a>
                      )}

                      {isStudentDocument && isUploaded && item.note && (
                        <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{item.note}</p>
                      )}

                      {isCompleteOrNa && isUploaded && item.note && (
                        <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{item.note}</p>
                      )}

                      {isCompleteOrNa && isUploaded && !isNoteOnlyComplete && item.fileUrl && item.fileName && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-sm font-medium text-[#38438f] hover:text-[#2d3569]"
                        >
                          View document: {item.fileName}
                        </a>
                      )}

                      {isNotApplicable && (
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Not applicable
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  {externalLink && !isNotApplicable && (
                    <Link
                      href={externalLink.href}
                      className="rounded-md border border-[#38438f] bg-white px-3 py-1.5 text-sm font-medium text-[#38438f] transition-colors hover:bg-[#e8eaf6]"
                    >
                      {externalLink.label}
                    </Link>
                  )}

                  {isStudentDocument && !isUploaded && !isExpanded && (
                    <button
                      type="button"
                      onClick={() => openUploadForm(item)}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569]"
                      style={{ backgroundColor: '#38438f' }}
                    >
                      Upload
                    </button>
                  )}

                  {isStudentDocument && isUploaded && !isExpanded && (
                    <>
                      <button
                        type="button"
                        onClick={() => openNoteForm(item)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        {item.note ? 'Edit note' : 'Add note'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openUploadForm(item)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Replace
                      </button>
                    </>
                  )}

                  {isCompleteOrNa && item.status === 'PENDING' && !isExpanded && (
                    <>
                      <button
                        type="button"
                        onClick={() => openCompleteForm(item)}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569]"
                        style={{ backgroundColor: '#38438f' }}
                      >
                        Mark complete
                      </button>
                      {showNotApplicable && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotApplicable(item.slug)}
                          disabled={isSaving}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          N/A
                        </button>
                      )}
                    </>
                  )}

                  {isCompleteOrNa && (isUploaded || isNotApplicable) && (
                    <button
                      type="button"
                      onClick={() => handleReset(item.slug)}
                      disabled={isSaving}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Undo
                    </button>
                  )}

                  {isCompleteOrNa && isUploaded && !isExpanded && (
                    <>
                      <button
                        type="button"
                        onClick={() => openNoteForm(item)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        {item.note ? 'Edit note' : 'Add note'}
                      </button>
                      {!isNoteOnlyComplete && (
                        <button
                          type="button"
                          onClick={() => openCompleteForm(item)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {showUploadPanel && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <label
                    htmlFor={`file-${item.slug}`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {isUploaded ? 'Replace document' : 'Upload document'}
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    This will appear on the student&apos;s My Docs page as &quot;
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
                      onClick={() => handleStudentDocumentUpload(item)}
                      disabled={isSaving || !fileDraft}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                      style={{ backgroundColor: '#38438f' }}
                    >
                      {isSaving ? 'Uploading…' : 'Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      disabled={isSaving}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showStudentDocNotePanel && (
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
                      onClick={() => handleSaveStudentDocumentNote(item)}
                      disabled={isSaving}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                      style={{ backgroundColor: '#38438f' }}
                    >
                      {isSaving ? 'Saving…' : 'Save note'}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      disabled={isSaving}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showCompleteOrNaNotePanel && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <label
                    htmlFor={`checklist-note-${item.slug}`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Note
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    e.g. date of meeting, who attended, or any relevant details.
                  </p>
                  <textarea
                    id={`checklist-note-${item.slug}`}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                    placeholder="Optional note about when this was done or any relevant details"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveCompleteOrNaNote(item)}
                      disabled={isSaving}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                      style={{ backgroundColor: '#38438f' }}
                    >
                      {isSaving ? 'Saving…' : 'Save note'}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      disabled={isSaving}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showCompletePanel && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <label
                    htmlFor={`note-${item.slug}`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Note (e.g. date completed or details)
                  </label>
                  <textarea
                    id={`note-${item.slug}`}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                    placeholder="Optional note about when this was done or any relevant details"
                  />

                  {!isNoteOnlyComplete && (
                    <div className="mt-3">
                      <label
                        htmlFor={`file-${item.slug}`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Upload document (optional)
                      </label>
                      <input
                        id={`file-${item.slug}`}
                        type="file"
                        accept={getAcceptAttribute()}
                        onChange={(e) => setFileDraft(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#e8eaf6] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#38438f] hover:file:bg-[#d8dcf0]"
                      />
                      {item.fileName && !fileDraft && (
                        <p className="mt-1 text-xs text-gray-500">
                          Current file: {item.fileName}. Upload a new file to replace it.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveComplete(item)}
                      disabled={isSaving}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
                      style={{ backgroundColor: '#38438f' }}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
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
  )
}
