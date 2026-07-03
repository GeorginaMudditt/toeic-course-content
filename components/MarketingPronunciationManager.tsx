'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  buildMarketingAudioPublicUrl,
  slugFromSupabaseAudioUrl,
  type MarketingPronunciationRow,
} from '@/lib/marketing-pronunciation'

type DraftRow = {
  key: string
  posted_date: string
  topic: string
  supabase_url: string
  slug: string
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDisplayDate(value: string) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function newDraftRow(topic = ''): DraftRow {
  return {
    key: `draft-${Date.now()}`,
    posted_date: todayIsoDate(),
    topic,
    supabase_url: '',
    slug: '',
  }
}

export default function MarketingPronunciationManager() {
  const [rows, setRows] = useState<MarketingPronunciationRow[]>([])
  const [stickyTopic, setStickyTopic] = useState('')
  const [draft, setDraft] = useState<DraftRow>(() => newDraftRow())
  const [edits, setEdits] = useState<Record<number, DraftRow>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | 'draft' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    setError(null)
    const response = await fetch('/api/marketing-pronunciation')
    const data = await response.json().catch(() => [])

    if (!response.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to load rows')
      return
    }

    setRows(data as MarketingPronunciationRow[])
    setEdits({})
  }, [])

  useEffect(() => {
    loadRows().finally(() => setLoading(false))
  }, [loadRows])

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const updateDraft = (field: keyof DraftRow, value: string) => {
    if (field === 'topic') {
      setStickyTopic(value)
    }

    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'supabase_url') {
        next.slug = slugFromSupabaseAudioUrl(value) || current.slug
      }
      return next
    })
  }

  const getEditRow = (row: MarketingPronunciationRow): DraftRow => {
    return (
      edits[row.id] ?? {
        key: `saved-${row.id}`,
        posted_date: row.posted_date,
        topic: row.topic,
        supabase_url: row.supabase_url,
        slug: row.slug,
      }
    )
  }

  const updateEditRow = (row: MarketingPronunciationRow, field: keyof DraftRow, value: string) => {
    setEdits((current) => {
      const base = getEditRow(row)
      const next = { ...base, [field]: value }
      if (field === 'supabase_url') {
        next.slug = slugFromSupabaseAudioUrl(value) || base.slug
      }
      return { ...current, [row.id]: next }
    })
  }

  const saveDraft = async () => {
    setSavingId('draft')
    setError(null)

    try {
      const response = await fetch('/api/marketing-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to save row')
        return
      }

      setRows((current) => [data as MarketingPronunciationRow, ...current])
      setDraft(newDraftRow(stickyTopic))
    } catch {
      setError('Failed to save row. Check your connection and try again.')
    } finally {
      setSavingId(null)
    }
  }

  const saveExisting = async (row: MarketingPronunciationRow) => {
    const edit = getEditRow(row)
    setSavingId(row.id)
    setError(null)

    try {
      const response = await fetch(`/api/marketing-pronunciation/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posted_date: edit.posted_date,
          topic: edit.topic,
          supabase_url: edit.supabase_url,
          slug: edit.slug,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to update row')
        return
      }

      setRows((current) =>
        current.map((item) => (item.id === row.id ? (data as MarketingPronunciationRow) : item))
      )
      setEdits((current) => {
        const next = { ...current }
        delete next[row.id]
        return next
      })
    } catch {
      setError('Failed to update row. Check your connection and try again.')
    } finally {
      setSavingId(null)
    }
  }

  const deleteRow = async (row: MarketingPronunciationRow) => {
    if (!window.confirm(`Delete the short link for "${row.slug}"?`)) return

    setDeletingId(row.id)
    setError(null)

    try {
      const response = await fetch(`/api/marketing-pronunciation/${row.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to delete row')
        return
      }

      setRows((current) => current.filter((item) => item.id !== row.id))
    } catch {
      setError('Failed to delete row. Check your connection and try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const draftPublicUrl = useMemo(() => {
    if (!draft.slug) return ''
    return buildMarketingAudioPublicUrl(draft.slug)
  }, [draft.slug])

  if (loading) {
    return <p className="text-sm text-gray-500">Loading pronunciation links…</p>
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <p className="mb-4 text-sm text-gray-600">
        Paste a Supabase URL from the <code className="rounded bg-gray-100 px-1">fb-wod-audio</code>{' '}
        bucket. The short link is generated automatically from the audio filename, for example{' '}
        <code className="rounded bg-gray-100 px-1">weather.mp3</code> becomes{' '}
        <code className="rounded bg-gray-100 px-1">www.brizzle-courses.com/audio/weather</code>.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Topic</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[280px]">
                Supabase URL
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[260px]">
                Brizzle URL
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-pink-50/40">
              <td className="px-4 py-3 align-top">
                <input
                  type="date"
                  value={draft.posted_date}
                  onChange={(event) => updateDraft('posted_date', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </td>
              <td className="px-4 py-3 align-top">
                <input
                  type="text"
                  value={draft.topic}
                  onChange={(event) => updateDraft('topic', event.target.value)}
                  placeholder="e.g. Weather"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </td>
              <td className="px-4 py-3 align-top">
                <input
                  type="url"
                  value={draft.supabase_url}
                  onChange={(event) => updateDraft('supabase_url', event.target.value)}
                  placeholder="https://.../fb-wod-audio/.../weather.mp3"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </td>
              <td className="px-4 py-3 align-top">
                <PublicUrlCell
                  slug={draft.slug}
                  publicUrl={draftPublicUrl}
                  audioUrl={draft.supabase_url}
                  copiedKey={copiedKey}
                  copyKey="draft"
                  onCopy={copyText}
                />
              </td>
              <td className="px-4 py-3 align-top">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={savingId === 'draft' || !draft.supabase_url.trim()}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: '#38438f' }}
                >
                  {savingId === 'draft' ? 'Saving…' : 'Add'}
                </button>
              </td>
            </tr>

            {rows.map((row) => {
              const edit = getEditRow(row)
              const publicUrl = buildMarketingAudioPublicUrl(edit.slug || row.slug)
              const isDirty =
                edit.posted_date !== row.posted_date ||
                edit.topic !== row.topic ||
                edit.supabase_url !== row.supabase_url ||
                edit.slug !== row.slug

              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="date"
                      value={edit.posted_date}
                      onChange={(event) => updateEditRow(row, 'posted_date', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-400">{formatDisplayDate(edit.posted_date)}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="text"
                      value={edit.topic}
                      onChange={(event) => updateEditRow(row, 'topic', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="url"
                      value={edit.supabase_url}
                      onChange={(event) => updateEditRow(row, 'supabase_url', event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <PublicUrlCell
                      slug={edit.slug}
                      publicUrl={publicUrl}
                      audioUrl={edit.supabase_url}
                      copiedKey={copiedKey}
                      copyKey={`row-${row.id}`}
                      onCopy={copyText}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {isDirty ? (
                        <button
                          type="button"
                          onClick={() => saveExisting(row)}
                          disabled={savingId === row.id}
                          className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: '#38438f' }}
                        >
                          {savingId === row.id ? 'Saving…' : 'Save'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteRow(row)}
                        disabled={deletingId === row.id}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === row.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No saved links yet. Add your first row above.</p>
      ) : null}
    </div>
  )
}

function PublicUrlCell({
  slug,
  publicUrl,
  audioUrl,
  copiedKey,
  copyKey,
  onCopy,
}: {
  slug: string
  publicUrl: string
  audioUrl: string
  copiedKey: string | null
  copyKey: string
  onCopy: (text: string, key: string) => void
}) {
  if (!slug || !publicUrl) {
    return <span className="text-xs text-gray-400">Paste a Supabase URL to generate a link</span>
  }

  return (
    <div className="space-y-2">
      <p className="font-semibold text-[#38438f] break-all">{publicUrl.replace(/^https?:\/\//, '')}</p>
      <p className="text-xs text-gray-500">Slug: {slug}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCopy(publicUrl, copyKey)}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copiedKey === copyKey ? 'Copied' : 'Copy'}
        </button>
        <Link
          href={`/audio/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Preview
        </Link>
        {audioUrl ? (
          <button
            type="button"
            onClick={() => {
              const audio = new Audio(audioUrl)
              void audio.play()
            }}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Play audio
          </button>
        ) : null}
      </div>
    </div>
  )
}
