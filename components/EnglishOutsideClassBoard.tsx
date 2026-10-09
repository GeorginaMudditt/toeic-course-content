'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ENGLISH_OUTSIDE_FORMATS,
  ENGLISH_OUTSIDE_LEVELS,
  ENGLISH_OUTSIDE_TITLE,
  ENGLISH_OUTSIDE_TOPICS,
  formatAverage,
  linkHost,
  type LibraryResource,
} from '@/lib/english-outside-class'
import { ResourceTags, ResourceThumbnail, StarRow, fieldClass } from '@/components/EnglishOutsideClassUi'

type Props = {
  resources: LibraryResource[]
  canContribute: boolean
  isTeacher: boolean
  backHref: string
  backLabel: string
}

const emptySuggestion = {
  title: '',
  url: '',
  format: 'series',
  whereToFind: '',
  whyRecommend: '',
  studentContentNote: '',
}

export default function EnglishOutsideClassBoard({
  resources,
  canContribute,
  isTeacher,
  backHref,
  backLabel,
}: Props) {
  const router = useRouter()
  const [formatFilter, setFormatFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [hideWarnings, setHideWarnings] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'newest' | 'rating'>('newest')
  const [suggestOpen, setSuggestOpen] = useState(resources.length === 0)
  const [suggestion, setSuggestion] = useState(emptySuggestion)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [cardError, setCardError] = useState<Record<string, string>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const next = resources.filter((resource) => {
      if (formatFilter !== 'all' && !resource.formats.includes(formatFilter)) return false
      if (levelFilter !== 'all' && resource.level !== levelFilter) return false
      if (topicFilter !== 'all' && !resource.topicTags.includes(topicFilter)) return false
      if (hideWarnings && resource.contentNotes.length > 0) return false
      if (!needle) return true
      return (
        resource.title.toLowerCase().includes(needle) ||
        resource.description.toLowerCase().includes(needle)
      )
    })
    if (sort === 'rating') {
      next.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0) || b.ratingCount - a.ratingCount)
    }
    return next
  }, [resources, formatFilter, levelFilter, topicFilter, hideWarnings, query, sort])

  const submitSuggestion = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuggestError(null)
    setSuggestSuccess(null)
    setSuggesting(true)
    try {
      const response = await fetch('/api/english-outside-class/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not send your suggestion')
      setSuggestion(emptySuggestion)
      setSuggestSuccess(
        'Thank you. Your teacher will read this and decide whether to add it. It will not appear on the list until then.'
      )
    } catch (error) {
      setSuggestError(error instanceof Error ? error.message : 'Could not send your suggestion')
    } finally {
      setSuggesting(false)
    }
  }

  const rate = async (resourceId: string, stars: number) => {
    setCardError((current) => ({ ...current, [resourceId]: '' }))
    setBusyId(resourceId)
    try {
      const response = await fetch(`/api/english-outside-class/${resourceId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not save your rating')
      router.refresh()
    } catch (error) {
      setCardError((current) => ({
        ...current,
        [resourceId]: error instanceof Error ? error.message : 'Could not save your rating',
      }))
    } finally {
      setBusyId(null)
    }
  }

  const comment = async (resourceId: string) => {
    const body = (commentDrafts[resourceId] || '').trim()
    setCardError((current) => ({ ...current, [resourceId]: '' }))
    setBusyId(resourceId)
    try {
      const response = await fetch(`/api/english-outside-class/${resourceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not send your comment')
      setCommentDrafts((current) => ({ ...current, [resourceId]: '' }))
      router.refresh()
    } catch (error) {
      setCardError((current) => ({
        ...current,
        [resourceId]: error instanceof Error ? error.message : 'Could not send your comment',
      }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ENGLISH_OUTSIDE_TITLE}</h1>
            <p className="text-gray-600 mt-2 max-w-3xl">
              Films, series, podcasts, audiobooks and books that can help you improve your English
              in real life.
            </p>
          </div>
          {isTeacher && (
            <Link
              href="/teacher/english-outside-class"
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#38438f' }}
            >
              Manage the list
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles"
            className={fieldClass}
            aria-label="Search titles"
          />
          <label className="shrink-0 text-sm text-gray-700 inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={hideWarnings}
              onChange={(event) => setHideWarnings(event.target.checked)}
              className="rounded border-gray-300 text-[#38438f] focus:ring-[#38438f]"
            />
            Hide titles with a content note
          </label>
        </div>
        <FilterRow
          label="Type"
          value={formatFilter}
          onChange={setFormatFilter}
          options={[{ id: 'all', label: 'All' }, ...ENGLISH_OUTSIDE_FORMATS]}
        />
        <FilterRow
          label="Level"
          value={levelFilter}
          onChange={setLevelFilter}
          options={[{ id: 'all', label: 'All' }, ...ENGLISH_OUTSIDE_LEVELS.filter((level) => level.id !== 'all')]}
        />
        <FilterRow
          label="Topic"
          value={topicFilter}
          onChange={setTopicFilter}
          options={[{ id: 'all', label: 'All' }, ...ENGLISH_OUTSIDE_TOPICS]}
        />
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-gray-500">
            {filtered.length} of {resources.length}
          </p>
          <label className="inline-flex items-center gap-2 text-gray-700">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value === 'rating' ? 'rating' : 'newest')}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="rating">Highest rated</option>
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-sm text-gray-600">
          {resources.length === 0
            ? 'Nothing has been added yet. Suggestions are welcome below.'
            : 'Nothing matches those filters.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((resource) => {
            const pendingMine = resource.comments.find((item) => item.pending && item.mine)
            const visibleComments = resource.comments.filter((item) => !item.pending)
            return (
              <article key={resource.id} className="bg-white shadow rounded-lg p-5 sm:p-6 space-y-3">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <ResourceThumbnail filename={resource.image} />
                  <div className="min-w-0 flex-1 space-y-3">
                <ResourceTags
                  formats={resource.formats}
                  level={resource.level}
                  topicTags={resource.topicTags}
                  contentNotes={resource.contentNotes}
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{resource.title}</h2>
                  <p className="text-gray-700 text-sm mt-2 leading-relaxed">{resource.description}</p>
                </div>
                {resource.suggestedByName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">Suggested by </span>
                    {resource.suggestedByName}
                  </p>
                )}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#38438f' }}
                >
                  Open {linkHost(resource.url)}
                </a>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <StarRow value={Math.round(resource.averageRating || 0)} label="Average rating" />
                    <span>
                      {resource.ratingCount > 0 && resource.averageRating
                        ? `${formatAverage(resource.averageRating)} from ${resource.ratingCount} rating${resource.ratingCount === 1 ? '' : 's'}`
                        : 'No ratings yet'}
                    </span>
                  </div>
                  {canContribute && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                      <span>Your rating</span>
                      <StarRow
                        value={resource.myRating || 0}
                        onChange={(stars) => rate(resource.id, stars)}
                        disabled={busyId === resource.id}
                        label={`Your rating for ${resource.title}`}
                      />
                    </div>
                  )}
                </div>

                {(visibleComments.length > 0 || pendingMine) && (
                  <ul className="space-y-2">
                    {visibleComments.map((item) => (
                      <li key={item.id} className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                        <p className="font-medium text-gray-900">{item.studentName}</p>
                        <p className="text-gray-700 mt-0.5">{item.body}</p>
                      </li>
                    ))}
                    {pendingMine && (
                      <li className="rounded-md bg-amber-50 px-3 py-2 text-sm">
                        <p className="font-medium text-amber-950">Your comment is waiting to be checked</p>
                        <p className="text-amber-950 mt-0.5">{pendingMine.body}</p>
                      </li>
                    )}
                  </ul>
                )}

                {canContribute && !pendingMine && (
                  <form
                    className="space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      comment(resource.id)
                    }}
                  >
                    <label className="block text-sm font-medium text-gray-700" htmlFor={`comment-${resource.id}`}>
                      Add a comment
                    </label>
                    <textarea
                      id={`comment-${resource.id}`}
                      rows={2}
                      maxLength={400}
                      value={commentDrafts[resource.id] || ''}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({ ...current, [resource.id]: event.target.value }))
                      }
                      placeholder="A sentence or two about whether you would recommend it."
                      className={fieldClass}
                    />
                    <p className="text-xs text-gray-500">
                      Your teacher checks comments before they appear, so the English stays clear.
                    </p>
                    <button
                      type="submit"
                      disabled={busyId === resource.id}
                      className="px-3 py-1.5 text-sm font-medium text-white rounded-md bg-[#38438f] disabled:opacity-50"
                    >
                      Send comment
                    </button>
                  </form>
                )}
                {cardError[resource.id] && (
                  <p className="text-sm text-red-700" role="alert">
                    {cardError[resource.id]}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}

      {canContribute && (
        <section className="bg-white shadow rounded-lg p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Suggest something</h2>
              <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                Tell your teacher about a film, series, podcast, book or anything else that helped
                your English. You do not add it yourself. Your teacher reads every suggestion, checks
                that it is suitable, and writes the description.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuggestOpen((open) => !open)}
              className="text-sm font-medium text-[#38438f]"
            >
              {suggestOpen ? 'Close' : 'Open the form'}
            </button>
          </div>
          {suggestOpen && (
            <form onSubmit={submitSuggestion} className="mt-5 space-y-4">
              <div>
                <label htmlFor="suggest-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="suggest-title"
                  required
                  value={suggestion.title}
                  onChange={(event) => setSuggestion((current) => ({ ...current, title: event.target.value }))}
                  className={fieldClass}
                  placeholder="e.g. The Office"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="suggest-format" className="block text-sm font-medium text-gray-700 mb-1">
                    What is it?
                  </label>
                  <select
                    id="suggest-format"
                    value={suggestion.format}
                    onChange={(event) => setSuggestion((current) => ({ ...current, format: event.target.value }))}
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
                  <label htmlFor="suggest-where" className="block text-sm font-medium text-gray-700 mb-1">
                    Where can we find it?
                  </label>
                  <input
                    id="suggest-where"
                    value={suggestion.whereToFind}
                    onChange={(event) =>
                      setSuggestion((current) => ({ ...current, whereToFind: event.target.value }))
                    }
                    className={fieldClass}
                    placeholder="Netflix, YouTube, a bookshop…"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="suggest-url" className="block text-sm font-medium text-gray-700 mb-1">
                  Link, if you have one
                </label>
                <input
                  id="suggest-url"
                  type="url"
                  value={suggestion.url}
                  onChange={(event) => setSuggestion((current) => ({ ...current, url: event.target.value }))}
                  className={fieldClass}
                  placeholder="https://"
                />
              </div>
              <div>
                <label htmlFor="suggest-why" className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you recommend it?
                </label>
                <textarea
                  id="suggest-why"
                  required
                  rows={4}
                  value={suggestion.whyRecommend}
                  onChange={(event) =>
                    setSuggestion((current) => ({ ...current, whyRecommend: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder="What did you enjoy, and how did it help your English?"
                />
              </div>
              <div>
                <label htmlFor="suggest-note" className="block text-sm font-medium text-gray-700 mb-1">
                  Anything your teacher should know?
                </label>
                <textarea
                  id="suggest-note"
                  rows={3}
                  value={suggestion.studentContentNote}
                  onChange={(event) =>
                    setSuggestion((current) => ({ ...current, studentContentNote: event.target.value }))
                  }
                  className={fieldClass}
                  placeholder="Strong language, violence, a difficult accent, or the level you think it suits."
                />
              </div>
              {suggestError && (
                <p className="text-sm text-red-700" role="alert">
                  {suggestError}
                </p>
              )}
              {suggestSuccess && (
                <p className="text-sm text-green-700" role="status">
                  {suggestSuccess}
                </p>
              )}
              <button
                type="submit"
                disabled={suggesting}
                className="px-4 py-2 bg-[#38438f] text-white rounded-md hover:opacity-90 disabled:opacity-50 text-sm font-medium"
              >
                {suggesting ? 'Sending…' : 'Send to your teacher'}
              </button>
            </form>
          )}
        </section>
      )}

      {isTeacher && (
        <p className="text-sm text-gray-500">
          Students can rate a title straight away. Comments and suggestions wait for you to check them.
        </p>
      )}
    </div>
  )
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  options: readonly { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500 w-14">{label}</span>
      {options.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${
              active
                ? 'bg-[#38438f] text-white border-[#38438f]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#38438f]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
