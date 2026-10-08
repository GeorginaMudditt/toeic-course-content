'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatUKDate } from '@/lib/date-utils'
import {
  ENGLISH_OUTSIDE_CONTENT_NOTES,
  ENGLISH_OUTSIDE_FORMATS,
  ENGLISH_OUTSIDE_LEVELS,
  ENGLISH_OUTSIDE_TITLE,
  ENGLISH_OUTSIDE_TOPICS,
  firstName,
  formatAverage,
  labelFor,
  type TeacherPendingComment,
  type TeacherResource,
  type TeacherSuggestion,
} from '@/lib/english-outside-class'
import { ResourceTags, TagSelect, fieldClass } from '@/components/EnglishOutsideClassUi'

type Draft = {
  id?: string
  suggestionId?: string
  title: string
  description: string
  url: string
  format: string
  whereToFind: string
  level: string
  topicTags: string[]
  contentNotes: string[]
  suggestedByName: string
  reference?: {
    studentName: string
    whyRecommend: string
    studentContentNote: string | null
  }
}

type Props = {
  resources: TeacherResource[]
  suggestions: TeacherSuggestion[]
  pendingComments: TeacherPendingComment[]
}

const emptyDraft = (): Draft => ({
  title: '',
  description: '',
  url: '',
  format: 'series',
  whereToFind: '',
  level: 'all',
  topicTags: [],
  contentNotes: [],
  suggestedByName: '',
})

export default function EnglishOutsideClassManager({
  resources,
  suggestions,
  pendingComments,
}: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [commentEdits, setCommentEdits] = useState<Record<string, string>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const startFromSuggestion = (suggestion: TeacherSuggestion) => {
    setFormError(null)
    setDraft({
      suggestionId: suggestion.id,
      title: suggestion.title,
      description: '',
      url: suggestion.url || '',
      format: suggestion.format,
      whereToFind: suggestion.whereToFind || '',
      level: 'all',
      topicTags: [],
      contentNotes: [],
      suggestedByName: firstName(suggestion.studentName),
      reference: {
        studentName: suggestion.studentName,
        whyRecommend: suggestion.whyRecommend,
        studentContentNote: suggestion.studentContentNote,
      },
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = (resource: TeacherResource) => {
    setFormError(null)
    setDraft({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      format: resource.format,
      whereToFind: resource.whereToFind || '',
      level: resource.level || 'all',
      topicTags: resource.topicTags,
      contentNotes: resource.contentNotes,
      suggestedByName: resource.suggestedByName || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft) return
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        title: draft.title,
        description: draft.description,
        url: draft.url,
        format: draft.format,
        whereToFind: draft.whereToFind,
        level: draft.level,
        topicTags: draft.topicTags,
        contentNotes: draft.contentNotes,
        suggestedByName: draft.suggestedByName,
        suggestionId: draft.suggestionId,
      }
      const response = await fetch(
        draft.id ? `/api/english-outside-class/${draft.id}` : '/api/english-outside-class',
        {
          method: draft.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not save')
      setDraft(null)
      router.refresh()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const runAction = async (key: string, url: string, method: string, body?: unknown) => {
    setActionError(null)
    setBusyKey(key)
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'That did not work')
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'That did not work')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ENGLISH_OUTSIDE_TITLE}</h1>
            <p className="text-gray-600 mt-2 max-w-3xl">
              Students cannot see this yet. Keep adding titles here. When it is opened to them, they
              will only see what you publish. They can suggest a title, rate one, and leave a
              comment. Suggestions are emailed to you, and both suggestions and comments wait here
              until you approve them. Ratings appear straight away.
            </p>
          </div>
          <Link
            href="/student/english-outside-class"
            className="text-sm font-medium text-[#38438f]"
          >
            Preview the student page
          </Link>
        </div>
      </div>

      {actionError && (
        <p className="text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      <section className="bg-white shadow rounded-lg p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {draft?.id ? 'Edit a title' : draft?.suggestionId ? 'Add from a suggestion' : 'Add a title'}
          </h2>
          {draft ? (
            <button type="button" onClick={() => setDraft(null)} className="text-sm text-gray-600">
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFormError(null)
                setDraft(emptyDraft())
              }}
              className="px-3 py-1.5 text-sm font-medium text-white rounded-md bg-[#38438f]"
            >
              New title
            </button>
          )}
        </div>

        {draft && (
          <form onSubmit={save} className="mt-5 space-y-4">
            {draft.reference && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-950 space-y-2">
                <p>
                  <strong>{draft.reference.studentName}</strong> suggested this. Write the public
                  description yourself. Their note is only a reference.
                </p>
                <p>
                  <span className="font-medium">Why they recommend it: </span>
                  {draft.reference.whyRecommend}
                </p>
                {draft.reference.studentContentNote && (
                  <p>
                    <span className="font-medium">Anything to know: </span>
                    {draft.reference.studentContentNote}
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="eoc-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="eoc-title"
                  required
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="eoc-format" className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  id="eoc-format"
                  value={draft.format}
                  onChange={(event) => setDraft({ ...draft, format: event.target.value })}
                  className={fieldClass}
                >
                  {ENGLISH_OUTSIDE_FORMATS.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="eoc-level" className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  id="eoc-level"
                  value={draft.level}
                  onChange={(event) => setDraft({ ...draft, level: event.target.value })}
                  className={fieldClass}
                >
                  {ENGLISH_OUTSIDE_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="eoc-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Link
                </label>
                <input
                  id="eoc-url"
                  type="url"
                  required
                  value={draft.url}
                  onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                  placeholder="https://"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="eoc-where" className="block text-sm font-medium text-gray-700 mb-1">
                  Where to find it
                </label>
                <input
                  id="eoc-where"
                  value={draft.whereToFind}
                  onChange={(event) => setDraft({ ...draft, whereToFind: event.target.value })}
                  placeholder="Netflix, BBC Sounds, a bookshop…"
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="eoc-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description students will see
                </label>
                <textarea
                  id="eoc-description"
                  required
                  rows={4}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="eoc-credit" className="block text-sm font-medium text-gray-700 mb-1">
                  Suggested by (optional)
                </label>
                <input
                  id="eoc-credit"
                  value={draft.suggestedByName}
                  onChange={(event) => setDraft({ ...draft, suggestedByName: event.target.value })}
                  placeholder="First name, if a student suggested it"
                  className={fieldClass}
                />
              </div>
            </div>
            <TagSelect
              legend="Topics"
              options={ENGLISH_OUTSIDE_TOPICS}
              selected={draft.topicTags}
              onChange={(topicTags) => setDraft({ ...draft, topicTags })}
            />
            <TagSelect
              legend="Content notes — students can hide anything with one of these"
              options={ENGLISH_OUTSIDE_CONTENT_NOTES}
              selected={draft.contentNotes}
              onChange={(contentNotes) => setDraft({ ...draft, contentNotes })}
            />
            {formError && (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#38438f] text-white rounded-md disabled:opacity-50 text-sm font-medium"
            >
              {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Publish on the student list'}
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Suggestions to check ({suggestions.length})
        </h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white shadow rounded-lg p-5">No suggestions waiting.</p>
        ) : (
          suggestions.map((suggestion) => (
            <article key={suggestion.id} className="bg-white shadow rounded-lg p-5 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900">{suggestion.title}</h3>
                <p className="text-xs text-gray-500">{formatUKDate(suggestion.createdAt)}</p>
              </div>
              <p className="text-sm text-gray-600">
                {labelFor(ENGLISH_OUTSIDE_FORMATS, suggestion.format)}
                {suggestion.whereToFind ? ` · ${suggestion.whereToFind}` : ''} · {suggestion.studentName}
              </p>
              {suggestion.url && (
                <a
                  href={suggestion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#38438f] break-all"
                >
                  {suggestion.url}
                </a>
              )}
              <p className="text-sm text-gray-800">{suggestion.whyRecommend}</p>
              {suggestion.studentContentNote && (
                <p className="text-sm text-amber-950 bg-amber-50 rounded-md px-3 py-2">
                  {suggestion.studentContentNote}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startFromSuggestion(suggestion)}
                  className="px-3 py-1.5 text-sm font-medium text-white rounded-md bg-[#38438f]"
                >
                  Write the listing
                </button>
                <button
                  type="button"
                  disabled={busyKey === suggestion.id}
                  onClick={() =>
                    runAction(suggestion.id, `/api/english-outside-class/suggestions/${suggestion.id}`, 'PATCH', {
                      status: 'DECLINED',
                    })
                  }
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md border border-gray-300 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Comments to check ({pendingComments.length})
        </h2>
        <p className="text-sm text-gray-600">
          Correct the English if you need to, then approve it. Declined comments are not shown to the class.
        </p>
        {pendingComments.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white shadow rounded-lg p-5">No comments waiting.</p>
        ) : (
          pendingComments.map((comment) => (
            <article key={comment.id} className="bg-white shadow rounded-lg p-5 space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{comment.studentName}</span> on{' '}
                {comment.resourceTitle} · {formatUKDate(comment.createdAt)}
              </p>
              <textarea
                rows={3}
                value={commentEdits[comment.id] ?? comment.body}
                onChange={(event) =>
                  setCommentEdits((current) => ({ ...current, [comment.id]: event.target.value }))
                }
                className={fieldClass}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyKey === comment.id}
                  onClick={() =>
                    runAction(comment.id, `/api/english-outside-class/comments/${comment.id}`, 'PATCH', {
                      status: 'APPROVED',
                      body: commentEdits[comment.id] ?? comment.body,
                    })
                  }
                  className="px-3 py-1.5 text-sm font-medium text-white rounded-md bg-[#38438f] disabled:opacity-50"
                >
                  Approve and show
                </button>
                <button
                  type="button"
                  disabled={busyKey === comment.id}
                  onClick={() =>
                    runAction(comment.id, `/api/english-outside-class/comments/${comment.id}`, 'PATCH', {
                      status: 'DECLINED',
                    })
                  }
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md border border-gray-300 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">On the list ({resources.length})</h2>
        {resources.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white shadow rounded-lg p-5">No titles yet.</p>
        ) : (
          resources.map((resource) => (
            <article
              key={resource.id}
              className={`bg-white shadow rounded-lg p-5 space-y-3 ${
                resource.status === 'HIDDEN' ? 'opacity-70' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-2">
                  <ResourceTags
                    format={resource.format}
                    level={resource.level}
                    topicTags={resource.topicTags}
                    contentNotes={resource.contentNotes}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  {resource.status === 'HIDDEN' ? 'Hidden from students' : 'Visible'}
                  {resource.ratingCount > 0 && resource.averageRating
                    ? ` · ${formatAverage(resource.averageRating)} from ${resource.ratingCount}`
                    : ''}
                </p>
              </div>
              <p className="text-sm text-gray-700">{resource.description}</p>
              <p className="text-sm text-gray-500 break-all">{resource.url}</p>
              {resource.approvedComments.length > 0 && (
                <ul className="space-y-2">
                  {resource.approvedComments.map((comment) => (
                    <li key={comment.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                      <p>
                        <span className="font-medium">{comment.studentName}: </span>
                        {comment.body}
                      </p>
                      <button
                        type="button"
                        disabled={busyKey === comment.id}
                        onClick={() =>
                          runAction(comment.id, `/api/english-outside-class/comments/${comment.id}`, 'PATCH', {
                            status: 'DECLINED',
                          })
                        }
                        className="text-xs text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(resource)}
                  className="px-3 py-1.5 text-sm font-medium text-white rounded-md bg-[#38438f]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyKey === resource.id}
                  onClick={() =>
                    runAction(resource.id, `/api/english-outside-class/${resource.id}`, 'PATCH', {
                      status: resource.status === 'HIDDEN' ? 'PUBLISHED' : 'HIDDEN',
                    })
                  }
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md border border-gray-300 disabled:opacity-50"
                >
                  {resource.status === 'HIDDEN' ? 'Show to students' : 'Hide'}
                </button>
                <button
                  type="button"
                  disabled={busyKey === `delete-${resource.id}`}
                  onClick={() => {
                    if (!window.confirm(`Remove “${resource.title}” from the list? Ratings and comments for it will be deleted.`)) {
                      return
                    }
                    runAction(`delete-${resource.id}`, `/api/english-outside-class/${resource.id}`, 'DELETE')
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 rounded-md border border-red-200 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
