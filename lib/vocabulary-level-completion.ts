export type VocabularyChallengeProgress = {
  bronze: boolean
  silver: boolean
  gold: boolean
}

const EMPTY_PROGRESS: VocabularyChallengeProgress = {
  bronze: false,
  silver: false,
  gold: false,
}

export function isChallengeFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1
}

export function normalizeVocabularyTopicName(topic: string): string {
  return topic.trim().replace(/\s+/g, ' ')
}

export function vocabularyProgressRecord(
  rows: Array<{ topic?: string | null; bronze: unknown; silver: unknown; gold: unknown }>
): Record<string, VocabularyChallengeProgress> {
  const record: Record<string, VocabularyChallengeProgress> = {}

  for (const row of rows) {
    if (!row.topic) continue
    const key = normalizeVocabularyTopicName(row.topic)
    const next = {
      bronze: isChallengeFlag(row.bronze),
      silver: isChallengeFlag(row.silver),
      gold: isChallengeFlag(row.gold),
    }
    const previous = record[key]
    record[key] = {
      bronze: Boolean(previous?.bronze) || next.bronze,
      silver: Boolean(previous?.silver) || next.silver,
      gold: Boolean(previous?.gold) || next.gold,
    }
  }

  return record
}

export function lookupTopicProgress(
  topicName: string,
  progressByTopic: Record<string, VocabularyChallengeProgress>
): VocabularyChallengeProgress {
  const normalized = normalizeVocabularyTopicName(topicName)
  const direct = progressByTopic[normalized] ?? progressByTopic[topicName]
  if (direct) return direct

  const match = Object.keys(progressByTopic).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  )
  return match ? progressByTopic[match]! : EMPTY_PROGRESS
}

export function isTopicFullyComplete(progress: VocabularyChallengeProgress): boolean {
  return progress.bronze && progress.silver && progress.gold
}

/** A level is complete when every theme has challenges 1, 2, and 3. */
export function isVocabularyLevelComplete(
  topicNames: string[],
  progressByTopic: Record<string, VocabularyChallengeProgress>
): boolean {
  if (topicNames.length === 0) return false
  return topicNames.every((topicName) =>
    isTopicFullyComplete(lookupTopicProgress(topicName, progressByTopic))
  )
}
