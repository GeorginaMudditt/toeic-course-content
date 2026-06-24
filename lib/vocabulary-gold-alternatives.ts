/** Extra accepted English answers for gold challenge typing (beyond word_english). */
const GOLD_ALTERNATIVES: Record<string, string[]> = {
  'a2|Activities (B)|spare time': ['free time'],
}

function normalizeGoldAnswer(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
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
