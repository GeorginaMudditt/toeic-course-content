import { assignLessonNumbers } from '@/lib/course-notes-lessons'

interface NotesRowWithTopic {
  date: string
  lessonTopic?: string
}

interface ResourceTitleRef {
  id: string
  title: string
}

/** Parse structured course notes JSON into rows (empty array if missing or legacy HTML). */
export function parseCourseNotesRows(content: string | null | undefined): NotesRowWithTopic[] {
  if (!content?.trim()) return []
  try {
    const parsed = JSON.parse(content) as { version?: unknown; rows?: NotesRowWithTopic[] }
    if (Number(parsed?.version) === 1 && Array.isArray(parsed.rows)) {
      return parsed.rows
    }
  } catch {
    // legacy HTML or invalid JSON
  }
  return []
}

/** Case-insensitive check that a lesson topic mentions the full resource title. */
export function topicMentionsResourceTitle(topic: string, title: string): boolean {
  const trimmedTitle = title.trim()
  if (!trimmedTitle) return false
  return topic.toLowerCase().includes(trimmedTitle.toLowerCase())
}

/**
 * For each assigned resource, return the course-lesson numbers (from dated notes rows)
 * whose lesson topic mentions that resource title (e.g. via @ picker in Notes).
 */
export function buildResourceStudiedLessonsMap(
  notesContent: string | null | undefined,
  resources: ResourceTitleRef[],
): Map<string, number[]> {
  const rows = parseCourseNotesRows(notesContent)
  const lessonNums = assignLessonNumbers(rows)
  const byResourceId = new Map<string, Set<number>>()

  const titlesByLength = [...resources]
    .filter((r) => r.title.trim())
    .sort((a, b) => b.title.length - a.title.length)

  for (let i = 0; i < rows.length; i++) {
    const lessonNum = lessonNums[i]
    if (lessonNum == null) continue

    const topic = (rows[i].lessonTopic ?? '').trim()
    if (!topic) continue

    for (const { id, title } of titlesByLength) {
      if (!topicMentionsResourceTitle(topic, title)) continue
      if (!byResourceId.has(id)) byResourceId.set(id, new Set())
      byResourceId.get(id)!.add(lessonNum)
    }
  }

  const result = new Map<string, number[]>()
  for (const [id, nums] of byResourceId) {
    result.set(id, [...nums].sort((a, b) => a - b))
  }
  return result
}
