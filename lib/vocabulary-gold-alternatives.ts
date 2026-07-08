/** Extra accepted English answers for gold challenge typing (beyond word_english). */
const GOLD_ALTERNATIVES: Record<string, string[]> = {
  'a2|Activities (B)|spare time': ['free time'],
  'a2|Adjectives (B)|amazing': ['incredible'],
  'a2|Adjectives (B)|good-looking': ['good looking'],
  'a2|Adjectives (B)|well-known': ['well known'],
  'a2|Arts|hip-hop': ['hip hop'],
  'a2|Buildings|bookshop': ['book shop'],
  'a2|Buildings|chemist': ['pharmacy'],
  'a2|Buildings|lift': ['elevator'],
  'a2|Buildings|secondary school': ['high school'],
  'a2|Buildings|sports centre': ['sports center'],
  'a2|Clothes|earring': ['earing'],
  'a2|Clothes|jewellery': ['jewelery'],
  'a2|Clothes|swimming costume': ['swimsuit'],
  'a2|Clothes|trainers': ['sneakers'],
  'a2|Communication|How about ...?': ['what about ...?', 'what about'],
  'a2|Communication|I don\'t mind': ['i do not mind'],
  'a2|Communication|mistake': ['error'],
  'a2|Communication|surname': ['family name'],
  'a2|Communication|You\'re welcome': ['you are welcome'],
  'a2|Education|headteacher': ['headmaster'],
  'a2|Education|maths': ['mathematics'],
  'a2|Education|pupil': ['student'],
  'a2|Education|term': ['semester'],
  'a2|Education|textbook': ['text book'],
  'a2|Food & Drink (A)|lunchtime': ['lunch time'],
  'a2|Food & Drink (A)|main course': ['main', 'main meal'],
  'a2|Food & Drink (A)|yoghurt': ['yogurt'],
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
  return value
    .replace(/\.{3,}/g, ' ')
    .replace(/[!?…]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase()
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
