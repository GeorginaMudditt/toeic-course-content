function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type VocabularyChallengeShuffleKey = 'silver-english' | 'silver-french' | 'gold'

/** Stable per level/topic/challenge, but different across Challenge 2 vs 3. */
export function shuffleForVocabularyChallenge<T>(
  items: T[],
  level: string,
  topic: string,
  challenge: VocabularyChallengeShuffleKey
): T[] {
  if (items.length <= 1) return [...items]

  const rng = mulberry32(hashString(`${level.toLowerCase()}|${topic.trim()}|${challenge}`))
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
