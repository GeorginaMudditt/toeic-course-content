export const VOCABULARY_LEVELS = ['a1', 'a2'] as const

export type VocabularyLevel = (typeof VOCABULARY_LEVELS)[number]

export const VOCABULARY_TABLES: Record<
  VocabularyLevel,
  { vocab: string; icons: string }
> = {
  a1: { vocab: 'Brizzle_A1_vocab', icons: 'Brizzle_A1_icons' },
  a2: { vocab: 'Brizzle_A2_vocab', icons: 'Brizzle_A2_icons' },
}

export function isVocabularyLevel(level: string): level is VocabularyLevel {
  return VOCABULARY_LEVELS.includes(level as VocabularyLevel)
}

export function slugifyVocabularyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function vocabularyAudioStoragePath(
  level: string,
  topicSlug: string,
  wordEnglish: string
): string {
  return `${level}/${topicSlug}/${slugifyVocabularyText(wordEnglish)}.mp3`
}
