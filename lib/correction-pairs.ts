export type CorrectionPair = {
  id: string
  mistake: string
  correction: string
}

export function createCorrectionPairId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function parseCorrectionPairs(raw: unknown): CorrectionPair[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const mistake = typeof o.mistake === 'string' ? o.mistake : ''
      const correction = typeof o.correction === 'string' ? o.correction : ''
      const id = typeof o.id === 'string' && o.id.trim() ? o.id : createCorrectionPairId()
      if (!mistake.trim() && !correction.trim()) return null
      return { id, mistake, correction }
    })
    .filter((item): item is CorrectionPair => item != null)
}

export function correctionPairsHaveContent(pairs: CorrectionPair[] | undefined): boolean {
  return (pairs ?? []).some((pair) => pair.mistake.trim() || pair.correction.trim())
}
