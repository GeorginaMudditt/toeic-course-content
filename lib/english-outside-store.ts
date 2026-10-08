import { promises as fs } from 'fs'
import path from 'path'
import { supabaseServer } from '@/lib/supabase'

export type ResourceRow = {
  id: string
  title: string
  description: string
  url: string
  format: string
  whereToFind: string | null
  level: string | null
  topicTags: string[]
  contentNotes: string[]
  suggestedByName: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type RatingRow = {
  id: string
  resourceId: string
  studentId: string
  stars: number
  createdAt: string
  updatedAt: string
}

export type CommentRow = {
  id: string
  resourceId: string
  studentId: string
  studentName: string
  body: string
  status: string
  createdAt: string
  updatedAt: string
}

export type SuggestionRow = {
  id: string
  studentId: string
  studentName: string
  title: string
  url: string | null
  format: string
  whereToFind: string | null
  whyRecommend: string
  studentContentNote: string | null
  status: string
  createdResourceId: string | null
  createdAt: string
  updatedAt: string
}

type FileStore = {
  resources: ResourceRow[]
  ratings: RatingRow[]
  comments: CommentRow[]
  suggestions: SuggestionRow[]
}

const FILE_PATH = path.join(process.cwd(), 'data', 'english-outside-class.json')

const SEED_RESOURCES: ResourceRow[] = [
  {
    id: 'eoc-bbc-6-minute',
    title: 'BBC 6 Minute English',
    description:
      'A short podcast from BBC Learning English. Each episode explores one topic from the news and teaches a few useful phrases. The presenters speak clearly, and a transcript is available on the website.',
    url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english',
    format: 'podcast',
    whereToFind: 'BBC Sounds, or the BBC Learning English website',
    level: 'a1-a2',
    topicTags: ['news'],
    contentNotes: [],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-07T10:00:00.000Z',
    updatedAt: '2026-03-07T10:00:00.000Z',
  },
  {
    id: 'eoc-paddington-2',
    title: 'Paddington 2',
    description:
      'A warm, funny film with clear British English and a story that is easy to follow. A good choice when you want everyday conversation without strong language or violence.',
    url: 'https://www.imdb.com/title/tt4468740/',
    format: 'film',
    whereToFind: 'Streaming services',
    level: 'a1-a2',
    topicTags: ['comedy', 'family'],
    contentNotes: [],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-06T10:00:00.000Z',
    updatedAt: '2026-03-06T10:00:00.000Z',
  },
  {
    id: 'eoc-planet-earth-ii',
    title: 'Planet Earth II',
    description:
      'David Attenborough narrates this nature series in rich but clear British English. The pictures help you understand new words. Some scenes show animals hunting.',
    url: 'https://www.bbcearth.com/shows/planet-earth-ii',
    format: 'series',
    whereToFind: 'BBC iPlayer, or other streaming services',
    level: 'b1-b2',
    topicTags: ['documentary', 'science'],
    contentNotes: [],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-05T10:00:00.000Z',
    updatedAt: '2026-03-05T10:00:00.000Z',
  },
  {
    id: 'eoc-ted-talks',
    title: 'TED Talks',
    description:
      'Short talks on ideas from science, work, culture and everyday life. Many speakers use clear international English, and you can turn on English subtitles. Pick a subject you already know something about, then watch with the transcript.',
    url: 'https://www.ted.com/talks',
    format: 'youtube',
    whereToFind: 'ted.com, the TED app, or YouTube',
    level: 'b1-b2',
    topicTags: ['science'],
    contentNotes: [],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-04T10:00:00.000Z',
    updatedAt: '2026-03-04T10:00:00.000Z',
  },
  {
    id: 'eoc-harry-potter-audio',
    title: "Harry Potter and the Philosopher's Stone (audiobook)",
    description:
      'Hearing a long story is excellent listening practice. This audiobook uses clear British English. If you can, follow the words in the book at the same time.',
    url: 'https://www.wizardingworld.com/discover/books',
    format: 'audiobook',
    whereToFind: 'Audible, a library, or the printed book alongside the recording',
    level: 'b1-b2',
    topicTags: ['family', 'drama'],
    contentNotes: [],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-03T10:00:00.000Z',
    updatedAt: '2026-03-03T10:00:00.000Z',
  },
  {
    id: 'eoc-the-office',
    title: 'The Office (UK)',
    description:
      'The original BBC workplace comedy, with natural British English, everyday office vocabulary, and a very dry sense of humour. Some episodes include strong language, so it is better suited to adults.',
    url: 'https://www.imdb.com/title/tt0290978/',
    format: 'series',
    whereToFind: 'BBC iPlayer, or other streaming services',
    level: 'b1-b2',
    topicTags: ['comedy'],
    contentNotes: ['strong-language'],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-02T10:00:00.000Z',
    updatedAt: '2026-03-02T10:00:00.000Z',
  },
  {
    id: 'eoc-atomic-habits',
    title: 'Atomic Habits by James Clear',
    description:
      'A practical book about building better habits. The English is modern and direct, and the chapters are short. A strong choice if you would rather read something useful than a novel.',
    url: 'https://jamesclear.com/atomic-habits',
    format: 'book',
    whereToFind: 'Bookshops, libraries, or an ebook',
    level: 'b2-plus',
    topicTags: ['self-help'],
    contentNotes: [],
    suggestedByName: null,
    status: 'PUBLISHED',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
]

let mode: 'database' | 'local' | null = null
let writeChain: Promise<void> = Promise.resolve()

function missingTable(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache|could not find the table/i.test(error.message || '')
  )
}

export async function englishOutsideStoreMode(): Promise<'database' | 'local'> {
  if (mode) return mode
  const { error } = await supabaseServer.from('EnglishOutsideResource').select('id').limit(1)
  if (!error) {
    mode = 'database'
  } else if (process.env.NODE_ENV !== 'production') {
    console.error('Real-World English is using a local preview file:', error.message)
    mode = 'local'
  } else {
    mode = 'database'
  }
  return mode
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as FileStore
    if (!parsed || !Array.isArray(parsed.resources)) {
      throw new Error('Real-World English preview file is not valid')
    }
    return {
      resources: parsed.resources,
      ratings: Array.isArray(parsed.ratings) ? parsed.ratings : [],
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const seeded: FileStore = {
      resources: SEED_RESOURCES,
      ratings: [],
      comments: [],
      suggestions: [],
    }
    await writeFileStore(seeded)
    return seeded
  }
}

async function writeFileStore(store: FileStore) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  const tempPath = `${FILE_PATH}.${process.pid}.tmp`
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2))
  await fs.rename(tempPath, FILE_PATH)
}

function withFileLock<T>(fn: (store: FileStore) => Promise<T> | T): Promise<T> {
  const run = writeChain.then(async () => {
    const store = await readFileStore()
    return fn(store)
  })
  writeChain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function byCreatedDesc<T extends { createdAt: string }>(rows: T[]) {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function listResourceRows(status?: 'PUBLISHED') {
  if ((await englishOutsideStoreMode()) === 'database') {
    let query = supabaseServer.from('EnglishOutsideResource').select('*').order('createdAt', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return { rows: [] as ResourceRow[], error: error.message, missingTable: missingTable(error) }
    return { rows: (data || []) as ResourceRow[], error: null, missingTable: false }
  }
  const store = await readFileStore()
  const rows = byCreatedDesc(store.resources).filter((row) => !status || row.status === status)
  return { rows, error: null, missingTable: false }
}

export async function listRatingRows(resourceIds: string[]) {
  if (resourceIds.length === 0) return { rows: [] as RatingRow[], error: null }
  if ((await englishOutsideStoreMode()) === 'database') {
    const { data, error } = await supabaseServer
      .from('EnglishOutsideRating')
      .select('*')
      .in('resourceId', resourceIds)
    if (error) return { rows: [] as RatingRow[], error: error.message }
    return { rows: (data || []) as RatingRow[], error: null }
  }
  const store = await readFileStore()
  return { rows: store.ratings.filter((row) => resourceIds.includes(row.resourceId)), error: null }
}

export async function listCommentRows(filter: {
  resourceIds?: string[]
  statuses?: string[]
  studentId?: string
}) {
  if ((await englishOutsideStoreMode()) === 'database') {
    let query = supabaseServer.from('EnglishOutsideComment').select('*').order('createdAt', { ascending: true })
    if (filter.resourceIds) {
      if (filter.resourceIds.length === 0) return { rows: [] as CommentRow[], error: null }
      query = query.in('resourceId', filter.resourceIds)
    }
    if (filter.statuses && filter.statuses.length > 0) query = query.in('status', filter.statuses)
    if (filter.studentId) query = query.eq('studentId', filter.studentId)
    const { data, error } = await query
    if (error) return { rows: [] as CommentRow[], error: error.message }
    return { rows: (data || []) as CommentRow[], error: null }
  }
  const store = await readFileStore()
  const rows = store.comments.filter((row) => {
    if (filter.resourceIds && !filter.resourceIds.includes(row.resourceId)) return false
    if (filter.statuses && !filter.statuses.includes(row.status)) return false
    if (filter.studentId && row.studentId !== filter.studentId) return false
    return true
  })
  rows.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
  return { rows, error: null }
}

export async function listSuggestionRows(status: string) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { data, error } = await supabaseServer
      .from('EnglishOutsideSuggestion')
      .select('*')
      .eq('status', status)
      .order('createdAt', { ascending: true })
    if (error) return { rows: [] as SuggestionRow[], error: error.message }
    return { rows: (data || []) as SuggestionRow[], error: null }
  }
  const store = await readFileStore()
  const rows = store.suggestions
    .filter((row) => row.status === status)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
  return { rows, error: null }
}

export async function insertResourceRow(row: ResourceRow) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { error } = await supabaseServer.from('EnglishOutsideResource').insert(row)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.resources.push(row)
    await writeFileStore(store)
  })
  return { error: null }
}

export async function updateResourceRow(id: string, patch: Partial<ResourceRow>) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { error } = await supabaseServer.from('EnglishOutsideResource').update(patch).eq('id', id)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.resources = store.resources.map((row) => (row.id === id ? { ...row, ...patch } : row))
    await writeFileStore(store)
  })
  return { error: null }
}

export async function deleteResourceRow(id: string) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { error } = await supabaseServer.from('EnglishOutsideResource').delete().eq('id', id)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.resources = store.resources.filter((row) => row.id !== id)
    store.ratings = store.ratings.filter((row) => row.resourceId !== id)
    store.comments = store.comments.filter((row) => row.resourceId !== id)
    store.suggestions = store.suggestions.map((row) =>
      row.createdResourceId === id ? { ...row, createdResourceId: null } : row
    )
    await writeFileStore(store)
  })
  return { error: null }
}

export async function findPublishedResource(id: string) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { data, error } = await supabaseServer
      .from('EnglishOutsideResource')
      .select('id')
      .eq('id', id)
      .eq('status', 'PUBLISHED')
      .maybeSingle()
    if (error) return { found: false, error: error.message }
    return { found: Boolean(data), error: null }
  }
  const store = await readFileStore()
  return {
    found: store.resources.some((row) => row.id === id && row.status === 'PUBLISHED'),
    error: null,
  }
}

export async function upsertRatingRow(row: RatingRow) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { data: existing, error: existingError } = await supabaseServer
      .from('EnglishOutsideRating')
      .select('id')
      .eq('resourceId', row.resourceId)
      .eq('studentId', row.studentId)
      .maybeSingle()
    if (existingError) return { error: existingError.message }
    if (existing) {
      const { error } = await supabaseServer
        .from('EnglishOutsideRating')
        .update({ stars: row.stars, updatedAt: row.updatedAt })
        .eq('id', existing.id)
      return { error: error?.message || null }
    }
    const { error } = await supabaseServer.from('EnglishOutsideRating').insert(row)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    const index = store.ratings.findIndex(
      (item) => item.resourceId === row.resourceId && item.studentId === row.studentId
    )
    if (index >= 0) {
      store.ratings[index] = { ...store.ratings[index], stars: row.stars, updatedAt: row.updatedAt }
    } else {
      store.ratings.push(row)
    }
    await writeFileStore(store)
  })
  return { error: null }
}

export async function hasPendingComment(resourceId: string, studentId: string) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { data, error } = await supabaseServer
      .from('EnglishOutsideComment')
      .select('id')
      .eq('resourceId', resourceId)
      .eq('studentId', studentId)
      .eq('status', 'PENDING')
      .limit(1)
    if (error) return { found: false, error: error.message }
    return { found: Boolean(data && data.length > 0), error: null }
  }
  const store = await readFileStore()
  return {
    found: store.comments.some(
      (row) => row.resourceId === resourceId && row.studentId === studentId && row.status === 'PENDING'
    ),
    error: null,
  }
}

export async function insertCommentRow(row: CommentRow) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { error } = await supabaseServer.from('EnglishOutsideComment').insert(row)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.comments.push(row)
    await writeFileStore(store)
  })
  return { error: null }
}

export async function updateCommentRow(id: string, patch: Partial<CommentRow>) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { error } = await supabaseServer.from('EnglishOutsideComment').update(patch).eq('id', id)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.comments = store.comments.map((row) => (row.id === id ? { ...row, ...patch } : row))
    await writeFileStore(store)
  })
  return { error: null }
}

export async function insertSuggestionRow(row: SuggestionRow) {
  if ((await englishOutsideStoreMode()) === 'database') {
    const { error } = await supabaseServer.from('EnglishOutsideSuggestion').insert(row)
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.suggestions.push(row)
    await writeFileStore(store)
  })
  return { error: null }
}

export async function markSuggestion(id: string, patch: Partial<SuggestionRow>, onlyIfStatus?: string) {
  if ((await englishOutsideStoreMode()) === 'database') {
    let query = supabaseServer.from('EnglishOutsideSuggestion').update(patch).eq('id', id)
    if (onlyIfStatus) query = query.eq('status', onlyIfStatus)
    const { error } = await query
    return { error: error?.message || null }
  }
  await withFileLock(async (store) => {
    store.suggestions = store.suggestions.map((row) => {
      if (row.id !== id) return row
      if (onlyIfStatus && row.status !== onlyIfStatus) return row
      return { ...row, ...patch }
    })
    await writeFileStore(store)
  })
  return { error: null }
}
