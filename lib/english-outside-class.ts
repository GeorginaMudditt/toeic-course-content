export const ENGLISH_OUTSIDE_TITLE = 'Real-World English'
export const ENGLISH_OUTSIDE_NAV_LABEL = 'Real-World English'

export const ENGLISH_OUTSIDE_CARD_DETAIL =
  'Suggest something you have enjoyed. Your teacher checks every idea before it is added.'

export function outsideClassCardSummary(count: number | null) {
  if (count && count > 0) {
    return `${count} thing${count === 1 ? '' : 's'} to watch, listen to, or read`
  }
  return 'Films, series, podcasts, books and more.'
}

export const ENGLISH_OUTSIDE_FORMATS = [
  { id: 'film', label: 'Film' },
  { id: 'series', label: 'Series' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'audiobook', label: 'Audiobook' },
  { id: 'book', label: 'Book' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'article', label: 'Article' },
] as const

export const ENGLISH_OUTSIDE_TOPICS = [
  { id: 'women', label: 'Women' },
  { id: 'midlife', label: 'Midlife' },
  { id: 'family', label: 'Family' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'parenting', label: 'Parenting' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'sport', label: 'Sport' },
  { id: 'education', label: 'Education' },
  { id: 'health', label: 'Health' },
  { id: 'food', label: 'Food' },
  { id: 'music', label: 'Music' },
  { id: 'culture', label: 'Culture' },
  { id: 'art', label: 'Art' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'nature', label: 'Nature' },
  { id: 'animals', label: 'Animals' },
  { id: 'technology', label: 'Technology' },
  { id: 'science', label: 'Science' },
  { id: 'history', label: 'History' },
  { id: 'news', label: 'News' },
  { id: 'society', label: 'Society' },
  { id: 'business', label: 'Business' },
  { id: 'travel', label: 'Travel' },
  { id: 'language-learning', label: 'Language learning' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'drama', label: 'Drama' },
  { id: 'romance', label: 'Romance' },
  { id: 'crime', label: 'Crime' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'biography', label: 'Biography' },
  { id: 'true-stories', label: 'True stories' },
  { id: 'self-help', label: 'Self-help' },
  { id: 'psychology', label: 'Psychology' },
  { id: 'feel-good', label: 'Feel-good' },
] as const

export const ENGLISH_OUTSIDE_CONTENT_NOTES = [
  { id: 'mild-language', label: 'Mild language' },
  { id: 'strong-language', label: 'Strong language' },
  { id: 'violence', label: 'Violence' },
  { id: 'graphic-scenes', label: 'Graphic scenes' },
  { id: 'frightening', label: 'Frightening scenes' },
] as const

export const ENGLISH_OUTSIDE_LEVELS = [
  { id: 'all', label: 'All' },
  { id: 'a1-plus', label: 'A1+' },
  { id: 'a1-a2', label: 'A1-A2' },
  { id: 'b1-plus', label: 'B1+' },
  { id: 'b1-b2', label: 'B1-B2' },
  { id: 'b2-plus', label: 'B2+' },
  { id: 'c1-plus', label: 'C1+' },
] as const

const FORMAT_IDS = new Set<string>(ENGLISH_OUTSIDE_FORMATS.map((item) => item.id))
const TOPIC_IDS = new Set<string>(ENGLISH_OUTSIDE_TOPICS.map((item) => item.id))
const NOTE_IDS = new Set<string>(ENGLISH_OUTSIDE_CONTENT_NOTES.map((item) => item.id))
const LEVEL_IDS = new Set<string>(ENGLISH_OUTSIDE_LEVELS.map((item) => item.id))

export function labelFor(
  options: readonly { id: string; label: string }[],
  id: string | null | undefined
) {
  if (!id) return ''
  return options.find((item) => item.id === id)?.label || id
}

export function firstName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'A student'
  return trimmed.split(/\s+/)[0]
}

export function formatAverage(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function linkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
}

/** Pictures for Real-World English live in public/real-world-english. */
export function realWorldEnglishImageSrc(filename: string | null | undefined) {
  if (!filename) return null
  const name = filename.trim().split('/').pop() || ''
  if (!/^[a-zA-Z0-9._ ()-]+\.(jpe?g|png|webp|gif)$/i.test(name)) return null
  return `/real-world-english/${encodeURIComponent(name)}`
}

export function sanitizeImageFileName(value: string) {
  const name = value.trim().split('/').pop() || ''
  if (!name) return null
  if (!/^[a-zA-Z0-9._ ()-]+\.(jpe?g|png|webp|gif)$/i.test(name)) return null
  return name
}

export type LibraryComment = {
  id: string
  studentName: string
  body: string
  pending: boolean
  mine: boolean
}

export type LibraryResource = {
  id: string
  title: string
  description: string
  url: string
  formats: string[]
  image: string | null
  level: string | null
  topicTags: string[]
  contentNotes: string[]
  suggestedByName: string | null
  createdAt: string
  averageRating: number | null
  ratingCount: number
  myRating: number | null
  comments: LibraryComment[]
}

export type TeacherResource = {
  id: string
  title: string
  description: string
  url: string
  formats: string[]
  image: string | null
  level: string | null
  topicTags: string[]
  contentNotes: string[]
  suggestedByName: string | null
  status: string
  createdAt: string
  averageRating: number | null
  ratingCount: number
  approvedComments: { id: string; studentName: string; body: string }[]
}

export type TeacherSuggestion = {
  id: string
  studentName: string
  title: string
  url: string | null
  format: string
  whereToFind: string | null
  whyRecommend: string
  studentContentNote: string | null
  createdAt: string
}

export type TeacherPendingComment = {
  id: string
  resourceId: string
  resourceTitle: string
  studentName: string
  body: string
  createdAt: string
}

export type ResourceWriteInput = {
  title: string
  description: string
  url: string
  formats: string[]
  image: string | null
  level: string
  topicTags: string[]
  contentNotes: string[]
  suggestedByName: string | null
}

function readString(body: Record<string, unknown>, key: string) {
  return typeof body[key] === 'string' ? body[key].trim() : ''
}

function readTags(body: Record<string, unknown>, key: string, allowed: Set<string>) {
  const raw = body[key]
  if (!Array.isArray(raw)) return []
  const unique = new Set<string>()
  for (const item of raw) {
    if (typeof item === 'string' && allowed.has(item)) unique.add(item)
  }
  return Array.from(unique)
}

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function parseResourceWrite(body: unknown): { ok: true; data: ResourceWriteInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request' }
  }
  const record = body as Record<string, unknown>
  const title = readString(record, 'title')
  const description = readString(record, 'description')
  const url = readString(record, 'url')
  const formats = readTags(record, 'formats', FORMAT_IDS)
  const image = sanitizeImageFileName(readString(record, 'image'))
  const level = readString(record, 'level') || 'all'
  const suggestedByName = readString(record, 'suggestedByName')

  if (title.length < 2 || title.length > 140) {
    return { ok: false, error: 'Add a title (2–140 characters).' }
  }
  if (description.length < 20 || description.length > 1200) {
    return { ok: false, error: 'Write a description of at least a sentence (20–1200 characters).' }
  }
  if (!isSafeHttpUrl(url)) {
    return { ok: false, error: 'Add a full link starting with https://' }
  }
  if (formats.length === 0) {
    return { ok: false, error: 'Choose at least one type, such as film, book, or podcast.' }
  }
  if (!LEVEL_IDS.has(level)) {
    return { ok: false, error: 'Choose a level.' }
  }
  if (readString(record, 'image') && !image) {
    return { ok: false, error: 'The picture needs to be a JPG, PNG, WEBP, or GIF file name.' }
  }
  if (suggestedByName.length > 80) {
    return { ok: false, error: 'The suggested-by name is too long.' }
  }

  return {
    ok: true,
    data: {
      title,
      description,
      url,
      formats,
      image,
      level,
      topicTags: readTags(record, 'topicTags', TOPIC_IDS),
      contentNotes: readTags(record, 'contentNotes', NOTE_IDS),
      suggestedByName: suggestedByName || null,
    },
  }
}

export function parseSuggestionWrite(body: unknown):
  | {
      ok: true
      data: {
        title: string
        url: string | null
        format: string
        whereToFind: string | null
        whyRecommend: string
        studentContentNote: string | null
      }
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request' }
  }
  const record = body as Record<string, unknown>
  const title = readString(record, 'title')
  const url = readString(record, 'url')
  const format = readString(record, 'format')
  const whereToFind = readString(record, 'whereToFind')
  const whyRecommend = readString(record, 'whyRecommend')
  const studentContentNote = readString(record, 'studentContentNote')

  if (title.length < 2 || title.length > 140) {
    return { ok: false, error: 'Add the title (2–140 characters).' }
  }
  if (!FORMAT_IDS.has(format)) {
    return { ok: false, error: 'Choose what kind of thing it is.' }
  }
  if (url && !isSafeHttpUrl(url)) {
    return { ok: false, error: 'The link needs to start with https://' }
  }
  if (whyRecommend.length < 10 || whyRecommend.length > 1000) {
    return { ok: false, error: 'Say briefly why you recommend it (at least 10 characters).' }
  }
  if (whereToFind.length > 160 || studentContentNote.length > 500) {
    return { ok: false, error: 'One of the answers is too long.' }
  }

  return {
    ok: true,
    data: {
      title,
      url: url || null,
      format,
      whereToFind: whereToFind || null,
      whyRecommend,
      studentContentNote: studentContentNote || null,
    },
  }
}

