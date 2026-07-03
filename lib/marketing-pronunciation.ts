import { slugifyVocabularyText } from '@/lib/vocabulary-levels'

export type MarketingPronunciationRow = {
  id: number
  posted_date: string
  topic: string
  supabase_url: string
  slug: string
  created_at: string
  updated_at: string
}

export function getMarketingAudioSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  return configured || 'https://www.brizzle-courses.com'
}

export function buildMarketingAudioPublicPath(slug: string): string {
  return `/audio/${slug}`
}

export function buildMarketingAudioPublicUrl(slug: string): string {
  return `${getMarketingAudioSiteOrigin()}${buildMarketingAudioPublicPath(slug)}`
}

/** Decode filename segment so `to%20bounce.mp3` becomes `to bounce` before slugifying. */
function decodeAudioFileBaseName(fileName: string): string {
  const withoutExt = fileName.replace(/\.(mp3|mpeg|wav|m4a|ogg)$/i, '')
  try {
    return decodeURIComponent(withoutExt.replace(/\+/g, ' '))
  } catch {
    return withoutExt.replace(/%20/gi, ' ')
  }
}

/** e.g. .../fb-wod-audio/heatwave-audio/weather.mp3 → weather */
export function slugFromSupabaseAudioUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const pathname = new URL(trimmed).pathname
    const fileName = pathname.split('/').pop() || ''
    const slug = slugifyVocabularyText(decodeAudioFileBaseName(fileName))
    return slug || null
  } catch {
    const withoutQuery = trimmed.split('?')[0]
    const fileName = withoutQuery.split('/').pop() || ''
    const slug = slugifyVocabularyText(decodeAudioFileBaseName(fileName))
    return slug || null
  }
}

export function isValidMarketingSupabaseUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false
  try {
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}

export function isValidMarketingSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
