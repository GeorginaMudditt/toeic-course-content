export interface VocabularyWord {
  word_english: string
  translation_french: string
}

/**
 * Group key for silver drag-and-drop.
 * Trailing sense notes like " (size)" / " (height)" are display-only so related
 * cards (e.g. grand(e) for big/tall) stay interchangeable. Gender markers such
 * as "(e)" are kept because they have no leading space before the parenthesis.
 */
export function frenchSilverMatchKey(french: string): string {
  return french.replace(/\s+\([^)]+\)\s*$/u, '').trim()
}

function groupIndicesByFrenchMatchKey(words: VocabularyWord[]): Map<string, number[]> {
  const byKey = new Map<string, number[]>()
  words.forEach((word, index) => {
    const key = frenchSilverMatchKey(word.translation_french)
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(index)
  })
  return byKey
}

/** Silver challenge: same French match key accepts English answers in any order. */
export function isSilverChallengeCorrect(
  words: VocabularyWord[],
  positions: Record<number, string>
): boolean {
  if (!words.length) return false
  for (let i = 0; i < words.length; i++) {
    if (!positions[i]?.trim()) return false
  }

  for (const indices of groupIndicesByFrenchMatchKey(words).values()) {
    const expected = [...indices].map((i) => words[i].word_english).sort()
    const actual = [...indices].map((i) => positions[i]).sort()
    if (expected.length !== actual.length) return false
    for (let j = 0; j < expected.length; j++) {
      if (expected[j] !== actual[j]) return false
    }
  }
  return true
}

export function getSilverSlotCorrectness(
  words: VocabularyWord[],
  positions: Record<number, string>
): Record<number, boolean> {
  const correctness: Record<number, boolean> = {}

  for (const indices of groupIndicesByFrenchMatchKey(words).values()) {
    const unmatched = indices.map((i) => words[i].word_english)

    for (const idx of indices) {
      const assigned = positions[idx]
      if (!assigned) {
        correctness[idx] = false
        continue
      }
      const matchAt = unmatched.findIndex((w) => w === assigned)
      if (matchAt >= 0) {
        correctness[idx] = true
        unmatched.splice(matchAt, 1)
      } else {
        correctness[idx] = false
      }
    }
  }

  return correctness
}
