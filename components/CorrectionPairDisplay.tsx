'use client'

import { diffWords, type DiffToken } from '@/lib/french-diff'
import type { CorrectionPair } from '@/lib/correction-pairs'

function HighlightedPhrase({
  tokens,
  variant,
}: {
  tokens: DiffToken[]
  variant: 'mistake' | 'correction'
}) {
  const changedClass =
    variant === 'mistake'
      ? 'font-bold text-rose-950'
      : 'font-bold text-emerald-950'

  return (
    <span>
      {tokens.map((token, index) => (
        <span key={`${token.text}-${index}`}>
          {index > 0 ? ' ' : null}
          {token.side === 'changed' ? (
            <strong className={changedClass}>{token.text}</strong>
          ) : (
            token.text
          )}
        </span>
      ))}
    </span>
  )
}

export function CorrectionPairCard({
  mistake,
  correction,
}: {
  mistake: string
  correction: string
}) {
  const { mistakeTokens, correctionTokens } = diffWords(mistake, correction)

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-md border border-gray-200 bg-white text-sm sm:grid-cols-2">
      <div className="border-b border-gray-100 px-3 py-2 text-rose-900 sm:border-b-0 sm:border-r">
        <span className="mr-1" aria-hidden>
          ❌
        </span>
        {mistake.trim() ? (
          <HighlightedPhrase tokens={mistakeTokens} variant="mistake" />
        ) : (
          <span className="italic text-gray-400">No original phrase</span>
        )}
      </div>
      <div className="px-3 py-2 text-emerald-900">
        <span className="mr-1" aria-hidden>
          ✅
        </span>
        {correction.trim() ? (
          <HighlightedPhrase tokens={correctionTokens} variant="correction" />
        ) : (
          <span className="italic text-gray-400">No correction</span>
        )}
      </div>
    </div>
  )
}

export function CorrectionPairsView({ pairs }: { pairs: CorrectionPair[] }) {
  const visible = pairs.filter((pair) => pair.mistake.trim() || pair.correction.trim())
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((pair) => (
        <CorrectionPairCard key={pair.id} mistake={pair.mistake} correction={pair.correction} />
      ))}
    </div>
  )
}
