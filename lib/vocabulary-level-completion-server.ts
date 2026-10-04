import { supabaseServer } from '@/lib/supabase'
import { VOCABULARY_LEVELS, VOCABULARY_TABLES, type VocabularyLevel } from '@/lib/vocabulary-levels'
import {
  isVocabularyLevelComplete,
  normalizeVocabularyTopicName,
  vocabularyProgressRecord,
} from '@/lib/vocabulary-level-completion'

async function topicNamesForLevel(level: VocabularyLevel): Promise<string[]> {
  const { vocab } = VOCABULARY_TABLES[level]
  const { data, error } = await supabaseServer.from(vocab).select('topic_page')

  if (error) {
    throw new Error(`Failed to fetch ${level} vocabulary themes: ${error.message}`)
  }

  const names = new Map<string, string>()
  for (const row of data || []) {
    if (typeof row.topic_page !== 'string' || !row.topic_page.trim()) continue
    const name = normalizeVocabularyTopicName(row.topic_page)
    const key = name.toLowerCase()
    if (!names.has(key)) names.set(key, name)
  }

  return Array.from(names.values())
}

async function progressForLevel(studentId: string, level: VocabularyLevel) {
  const { data, error } = await supabaseServer
    .from('VocabularyProgress')
    .select('topic, bronze, silver, gold')
    .eq('studentId', studentId)
    .eq('level', level)

  if (error) {
    throw new Error(`Failed to fetch ${level} vocabulary progress: ${error.message}`)
  }

  return vocabularyProgressRecord(data || [])
}

export async function getCompletedVocabularyLevelIds(studentId: string): Promise<Set<string>> {
  const completed = new Set<string>()

  await Promise.all(
    VOCABULARY_LEVELS.map(async (level) => {
      const [topicNames, progress] = await Promise.all([
        topicNamesForLevel(level),
        progressForLevel(studentId, level),
      ])
      if (isVocabularyLevelComplete(topicNames, progress)) {
        completed.add(level)
      }
    })
  )

  return completed
}
