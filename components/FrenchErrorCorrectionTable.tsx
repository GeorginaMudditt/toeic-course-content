'use client'

import { useEffect, useState } from 'react'
import { FRENCH_CORRECTION_SEEDS } from '@/lib/french-content'
import { diffWords, type DiffToken } from '@/lib/french-diff'

const STORAGE_KEY = 'brizzle-french-corrections-v1'

type CorrectionRow = {
  id: string
  mistake: string
  correction: string
}

function HighlightedPhrase({
  tokens,
  variant,
}: {
  tokens: DiffToken[]
  variant: 'mistake' | 'correction'
}) {
  const changedClass =
    variant === 'mistake'
      ? 'rounded px-0.5 bg-rose-200 text-rose-950 font-semibold'
      : 'rounded px-0.5 bg-emerald-200 text-emerald-950 font-semibold'

  return (
    <span>
      {tokens.map((token, index) => (
        <span key={`${token.text}-${index}`}>
          {index > 0 ? ' ' : null}
          {token.side === 'changed' ? (
            <mark className={changedClass}>{token.text}</mark>
          ) : (
            token.text
          )}
        </span>
      ))}
    </span>
  )
}

function CorrectionDisplay({
  mistake,
  correction,
}: {
  mistake: string
  correction: string
}) {
  const { mistakeTokens, correctionTokens } = diffWords(mistake, correction)

  return (
    <>
      <td className="px-4 py-3 text-rose-900">
        <span className="mr-1 text-rose-500" aria-hidden>
          ✗
        </span>
        <HighlightedPhrase tokens={mistakeTokens} variant="mistake" />
      </td>
      <td className="px-4 py-3 text-emerald-900">
        <span className="mr-1 text-emerald-600" aria-hidden>
          ✓
        </span>
        <HighlightedPhrase tokens={correctionTokens} variant="correction" />
      </td>
    </>
  )
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `fr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function seedRows(): CorrectionRow[] {
  return FRENCH_CORRECTION_SEEDS.map((row) => ({
    id: createId(),
    mistake: row.mistake,
    correction: row.correction,
  }))
}

function loadRows(): CorrectionRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedRows()
    const parsed = JSON.parse(raw) as CorrectionRow[]
    if (!Array.isArray(parsed)) return seedRows()
    return parsed.filter(
      (row) =>
        row &&
        typeof row.id === 'string' &&
        typeof row.mistake === 'string' &&
        typeof row.correction === 'string'
    )
  } catch {
    return seedRows()
  }
}

export default function FrenchErrorCorrectionTable() {
  const [rows, setRows] = useState<CorrectionRow[]>([])
  const [ready, setReady] = useState(false)
  const [mistake, setMistake] = useState('')
  const [correction, setCorrection] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMistake, setEditMistake] = useState('')
  const [editCorrection, setEditCorrection] = useState('')

  useEffect(() => {
    setRows(loadRows())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  }, [rows, ready])

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault()
    const nextMistake = mistake.trim()
    const nextCorrection = correction.trim()
    if (!nextMistake || !nextCorrection) return

    setRows((current) => [
      { id: createId(), mistake: nextMistake, correction: nextCorrection },
      ...current,
    ])
    setMistake('')
    setCorrection('')
  }

  const startEdit = (row: CorrectionRow) => {
    setEditingId(row.id)
    setEditMistake(row.mistake)
    setEditCorrection(row.correction)
  }

  const saveEdit = () => {
    if (!editingId) return
    const nextMistake = editMistake.trim()
    const nextCorrection = editCorrection.trim()
    if (!nextMistake || !nextCorrection) return

    setRows((current) =>
      current.map((row) =>
        row.id === editingId
          ? { ...row, mistake: nextMistake, correction: nextCorrection }
          : row
      )
    )
    setEditingId(null)
    setEditMistake('')
    setEditCorrection('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditMistake('')
    setEditCorrection('')
  }

  const deleteRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id))
    if (editingId === id) cancelEdit()
  }

  if (!ready) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        Loading corrections…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Add a correction</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Mistake</span>
            <textarea
              value={mistake}
              onChange={(event) => setMistake(event.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
              placeholder="What you said or wrote…"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Correction</span>
            <textarea
              value={correction}
              onChange={(event) => setCorrection(event.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
              placeholder="The corrected version…"
              required
            />
          </label>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
            style={{ backgroundColor: '#38438f' }}
          >
            Add to table
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-rose-800">
                  Mistake
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-emerald-800">
                  Correction
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No corrections yet. Add your first one above.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    {editingId === row.id ? (
                      <>
                        <td className="px-4 py-3">
                          <textarea
                            value={editMistake}
                            onChange={(event) => setEditMistake(event.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            value={editCorrection}
                            onChange={(event) => setEditCorrection(event.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                          />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="mr-2 text-sm font-medium text-[#38438f] hover:underline"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-sm font-medium text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <CorrectionDisplay
                          mistake={row.mistake}
                          correction={row.correction}
                        />
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="mr-2 text-sm font-medium text-[#38438f] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRow(row.id)}
                            className="text-sm font-medium text-rose-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
