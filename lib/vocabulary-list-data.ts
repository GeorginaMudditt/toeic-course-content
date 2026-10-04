import { supabaseServer } from '@/lib/supabase'
import {
  isVocabularyLevel,
  VOCABULARY_TABLES,
  type VocabularyLevel,
} from '@/lib/vocabulary-levels'

export interface VocabularyListEntry {
  word_english: string
  translation_french: string
}

export interface VocabularyListCategory {
  topic: string
  entries: VocabularyListEntry[]
}

/** Levels whose full vocabulary list PDF is generated from stored vocabulary data. */
export const GENERATED_VOCABULARY_LIST_LEVELS = ['a1', 'a2'] as const

export type GeneratedVocabularyListLevel =
  (typeof GENERATED_VOCABULARY_LIST_LEVELS)[number]

export function supportsGeneratedVocabularyList(
  level: string
): level is GeneratedVocabularyListLevel {
  return GENERATED_VOCABULARY_LIST_LEVELS.includes(
    level as GeneratedVocabularyListLevel
  )
}

export async function getVocabularyListEntries(
  level: VocabularyLevel
): Promise<VocabularyListEntry[]> {
  const { vocab } = VOCABULARY_TABLES[level]

  const { data, error } = await supabaseServer
    .from(vocab)
    .select('word_english, translation_french')

  if (error) {
    throw new Error(`Failed to fetch vocabulary list: ${error.message}`)
  }

  const entries = (data || [])
    .filter(
      (row): row is VocabularyListEntry =>
        typeof row.word_english === 'string' &&
        typeof row.translation_french === 'string' &&
        row.word_english.trim().length > 0 &&
        row.translation_french.trim().length > 0
    )
    .map((row) => ({
      word_english: row.word_english.trim(),
      translation_french: row.translation_french.trim(),
    }))

  entries.sort((a, b) =>
    a.word_english.localeCompare(b.word_english, 'en', { sensitivity: 'base' })
  )

  return entries
}

export async function getVocabularyListEntriesForLevel(
  level: string
): Promise<VocabularyListEntry[]> {
  if (!isVocabularyLevel(level)) {
    throw new Error(`Unsupported vocabulary level: ${level}`)
  }

  return getVocabularyListEntries(level)
}

function normalizeTopicName(topic: string): string {
  return topic.trim().replace(/\s+/g, ' ')
}

export async function getVocabularyListCategories(
  level: VocabularyLevel
): Promise<VocabularyListCategory[]> {
  const { vocab } = VOCABULARY_TABLES[level]

  const { data, error } = await supabaseServer
    .from(vocab)
    .select('topic_page, word_english, translation_french')

  if (error) {
    throw new Error(`Failed to fetch vocabulary list: ${error.message}`)
  }

  const groups = new Map<string, VocabularyListCategory>()

  for (const row of data || []) {
    if (
      typeof row.topic_page !== 'string' ||
      typeof row.word_english !== 'string' ||
      typeof row.translation_french !== 'string'
    ) {
      continue
    }

    const topic = normalizeTopicName(row.topic_page)
    const wordEnglish = row.word_english.trim()
    const translationFrench = row.translation_french.trim()
    if (!topic || !wordEnglish || !translationFrench) continue

    const key = topic.toLowerCase()
    const category = groups.get(key) ?? { topic, entries: [] }
    category.entries.push({
      word_english: wordEnglish,
      translation_french: translationFrench,
    })
    groups.set(key, category)
  }

  const categories = Array.from(groups.values())
  for (const category of categories) {
    category.entries.sort((a, b) =>
      a.word_english.localeCompare(b.word_english, 'en', { sensitivity: 'base' })
    )
  }
  categories.sort((a, b) => a.topic.localeCompare(b.topic, 'en', { sensitivity: 'base' }))

  return categories
}

export async function getVocabularyListCategoriesForLevel(
  level: string
): Promise<VocabularyListCategory[]> {
  if (!isVocabularyLevel(level)) {
    throw new Error(`Unsupported vocabulary level: ${level}`)
  }

  return getVocabularyListCategories(level)
}
