import pilotData from '@/data/a2-vocabulary-pilot.json'

interface VocabularyWord {
  word_english: string
  pron_english?: string | null
  translation_french: string
  created_at?: string
  id?: string | number
}

interface PilotTopic {
  topic_page: string
  bronze_groups?: string[][]
}

/** Challenge 1 display order — grouped words stay consecutive; unlisted words keep API order at the end. */
export function orderWordsForBronze(
  level: string,
  topic: string,
  words: VocabularyWord[]
): VocabularyWord[] {
  if (level !== 'a2' || !words.length) return words

  const topicConfig = (pilotData.topics as PilotTopic[]).find(
    (entry) => entry.topic_page === topic
  )
  const groups = topicConfig?.bronze_groups
  if (!groups?.length) return words

  const byEnglish = new Map(
    words.map((word) => [word.word_english.toLowerCase(), word])
  )
  const ordered: VocabularyWord[] = []
  const used = new Set<string>()

  for (const group of groups) {
    for (const wordEnglish of group) {
      const key = wordEnglish.toLowerCase()
      const word = byEnglish.get(key)
      if (word && !used.has(key)) {
        ordered.push(word)
        used.add(key)
      }
    }
  }

  for (const word of words) {
    const key = word.word_english.toLowerCase()
    if (!used.has(key)) {
      ordered.push(word)
      used.add(key)
    }
  }

  return ordered
}
