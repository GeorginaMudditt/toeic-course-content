/** Extra accepted English answers for gold challenge typing (beyond word_english). */
const GOLD_ALTERNATIVES: Record<string, string[]> = {
  'a2|Activities (B)|spare time': ['free time'],
  'a2|Adjectives (B)|amazing': ['incredible'],
  'a2|Adjectives (B)|good-looking': ['good looking'],
  'a2|Adjectives (B)|well-known': ['well known'],
  'a2|Money|half-price': ['half price'],
  'a2|Technology|web page': ['website', 'web site'],
  'a2|Travel (A)|aeroplane': ['plane', 'airplane'],
  'a2|Travel (A)|bicycle': ['bike'],
  'a2|Travel (A)|car park': ['carpark'],
  'a2|Travel (A)|driving licence': ['driving license'],
  'a2|Travel (B)|underground': ['subway'],
  'a2|Verbs (B)|to book': ['to reserve'],
}

export interface VocabularyWord {
  word_english: string
  translation_french: string
}

function normalizeGoldAnswer(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
}

function groupIndicesByFrench(words: VocabularyWord[]): Map<string, number[]> {
  const byFrench = new Map<string, number[]>()
  words.forEach((word, index) => {
    const french = word.translation_french
    if (!byFrench.has(french)) byFrench.set(french, [])
    byFrench.get(french)!.push(index)
  })
  return byFrench
}

/** Gold challenge: duplicate French (e.g. femme → woman/wife) accepts answers in any order. */
export function isGoldChallengeCorrect(
  words: VocabularyWord[],
  goldInputs: Record<number, string>,
  level: string,
  topic: string
): boolean {
  if (!words.length) return false
  for (let i = 0; i < words.length; i++) {
    if (!goldInputs[i]?.trim()) return false
  }

  for (const indices of groupIndicesByFrench(words).values()) {
    const unmatched = indices.map((index) => words[index].word_english)
    for (const index of indices) {
      const userRaw = goldInputs[index] || ''
      const matchAt = unmatched.findIndex((expected) =>
        isGoldEnglishAnswerCorrect(
          userRaw,
          expected,
          getGoldAlternatives(level, topic, expected)
        )
      )
      if (matchAt < 0) return false
      unmatched.splice(matchAt, 1)
    }
  }

  return true
}

export function getGoldSlotCorrectness(
  words: VocabularyWord[],
  goldInputs: Record<number, string>,
  level: string,
  topic: string
): Record<number, boolean> {
  const correctness: Record<number, boolean> = {}

  for (const indices of groupIndicesByFrench(words).values()) {
    const unmatched = indices.map((index) => words[index].word_english)
    for (const index of indices) {
      const userRaw = goldInputs[index] || ''
      if (!userRaw.trim()) {
        correctness[index] = false
        continue
      }
      const matchAt = unmatched.findIndex((expected) =>
        isGoldEnglishAnswerCorrect(
          userRaw,
          expected,
          getGoldAlternatives(level, topic, expected)
        )
      )
      if (matchAt >= 0) {
        correctness[index] = true
        unmatched.splice(matchAt, 1)
      } else {
        correctness[index] = false
      }
    }
  }

  return correctness
}

export function getGoldAlternatives(
  level: string,
  topic: string,
  wordEnglish: string
): string[] {
  const key = `${level.toLowerCase()}|${topic.trim()}|${wordEnglish}`
  return GOLD_ALTERNATIVES[key] ?? []
}

export function isGoldEnglishAnswerCorrect(
  userInput: string,
  expectedEnglish: string,
  alternatives: string[] = []
): boolean {
  const user = normalizeGoldAnswer(userInput)
  if (!user) return false
  if (user === normalizeGoldAnswer(expectedEnglish)) return true
  return alternatives.some((alt) => user === normalizeGoldAnswer(alt))
}
