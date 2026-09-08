'use client'

import { useState } from 'react'
import {
  createCorrectionPairId,
  type CorrectionPair,
} from '@/lib/correction-pairs'
import { CorrectionPairCard } from '@/components/CorrectionPairDisplay'

type Props = {
  pairs: CorrectionPair[]
  onChange: (pairs: CorrectionPair[]) => void
}

export default function LessonCorrectionPairsEditor({ pairs, onChange }: Props) {
  const [mistake, setMistake] = useState('')
  const [correction, setCorrection] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMistake, setEditMistake] = useState('')
  const [editCorrection, setEditCorrection] = useState('')

  const addPair = (event: React.FormEvent) => {
    event.preventDefault()
    const nextMistake = mistake.trim()
    const nextCorrection = correction.trim()
    if (!nextMistake || !nextCorrection) return

    onChange([
      ...pairs,
      {
        id: createCorrectionPairId(),
        mistake: nextMistake,
        correction: nextCorrection,
      },
    ])
    setMistake('')
    setCorrection('')
  }

  const startEdit = (pair: CorrectionPair) => {
    setEditingId(pair.id)
    setEditMistake(pair.mistake)
    setEditCorrection(pair.correction)
  }

  const saveEdit = () => {
    if (!editingId) return
    const nextMistake = editMistake.trim()
    const nextCorrection = editCorrection.trim()
    if (!nextMistake || !nextCorrection) return

    onChange(
      pairs.map((pair) =>
        pair.id === editingId
          ? { ...pair, mistake: nextMistake, correction: nextCorrection }
          : pair
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

  const deletePair = (id: string) => {
    onChange(pairs.filter((pair) => pair.id !== id))
    if (editingId === id) cancelEdit()
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Type the phrase they said and the correct version, then add it. You and the student will
        see two columns, for example:{' '}
        <span className="whitespace-nowrap text-rose-800">❌ <strong>I&apos;m</strong> born in Bulgaria</span>
        {' · '}
        <span className="whitespace-nowrap text-emerald-800">✅ <strong>I was</strong> born in Bulgaria</span>
      </p>
      <form onSubmit={addPair} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-rose-800">What they said</span>
          <textarea
            value={mistake}
            onChange={(event) => setMistake(event.target.value)}
            rows={2}
            className="w-full rounded-md border border-rose-200 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
            placeholder="Incorrect phrase…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-emerald-800">Correct version</span>
          <textarea
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            rows={2}
            className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
            placeholder="Corrected phrase…"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!mistake.trim() || !correction.trim()}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#38438f' }}
          >
            Add correction
          </button>
        </div>
      </form>

      {pairs.length > 0 ? (
        <div className="space-y-2">
          {pairs.map((pair) => (
            <div key={pair.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                {editingId === pair.id ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <textarea
                      value={editMistake}
                      onChange={(event) => setEditMistake(event.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-rose-200 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                    />
                    <textarea
                      value={editCorrection}
                      onChange={(event) => setEditCorrection(event.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                    />
                  </div>
                ) : (
                  <CorrectionPairCard mistake={pair.mistake} correction={pair.correction} />
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1 pt-2">
                {editingId === pair.id ? (
                  <>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="text-xs font-medium text-[#38438f] hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs font-medium text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(pair)}
                      className="text-xs font-medium text-[#38438f] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePair(pair.id)}
                      className="text-xs font-medium text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No phrase corrections yet for this lesson.</p>
      )}
    </div>
  )
}
