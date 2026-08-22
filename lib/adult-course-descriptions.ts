/**
 * Course description PDF links for Qualiopi Indicator 1.
 * Update pdfFileName when a new version is published to Supabase.
 */

import { buildCourseDescriptionPdfUrl } from '@/lib/course-description-pdf'

export type AdultCourseDescriptionCategory = 'pro' | 'toeic' | 'daily'

export interface AdultCourseDescription {
  slug: string
  title: string
  hours: string
  price: string
  pdfFileName: string
  pdfUrl: string
  category: AdultCourseDescriptionCategory
  updatedAt?: string
}

function course(
  entry: Omit<AdultCourseDescription, 'pdfUrl'>,
): AdultCourseDescription {
  return {
    ...entry,
    pdfUrl: buildCourseDescriptionPdfUrl(entry.pdfFileName),
  }
}

export const adultCourseDescriptionsFallback: AdultCourseDescription[] = [
  course({
    slug: 'pro-pack-launch',
    title: 'PRO Pack Launch',
    hours: '10 heures',
    price: '750 €',
    pdfFileName: 'PRO_Pack_Launch.pdf',
    category: 'pro',
  }),
  course({
    slug: 'pro-pack-scale',
    title: 'PRO Pack Scale',
    hours: '20 heures',
    price: '1 400 €',
    pdfFileName: 'PRO_Pack_Scale.pdf',
    category: 'pro',
  }),
  course({
    slug: 'pro-pack-lead',
    title: 'PRO Pack Lead',
    hours: '40 heures',
    price: '2 600 €',
    pdfFileName: 'PRO_Pack_Lead.pdf',
    category: 'pro',
  }),
  course({
    slug: 'speak-english-with-confidence',
    title: 'Speak English with Confidence',
    hours: '10 heures',
    price: '400 €',
    pdfFileName: 'Speak_English_with_Confidence.pdf',
    category: 'daily',
  }),
  course({
    slug: 'travel-english',
    title: 'Travel English',
    hours: '10 heures',
    price: '400 €',
    pdfFileName: 'Travel_English.pdf',
    category: 'daily',
  }),
  course({
    slug: 'serve-and-sell-in-english',
    title: 'Serve and Sell in English',
    hours: '10 heures',
    price: '400 €',
    pdfFileName: 'Serve_and_Sell_in_English.pdf',
    category: 'daily',
  }),
  course({
    slug: 'toeic-pack-progress',
    title: 'TOEIC® Pack Progress',
    hours: '15 heures',
    price: '1 200 €',
    pdfFileName: 'TOEIC_Pack_Progress_v1.9.pdf',
    category: 'toeic',
  }),
  course({
    slug: 'toeic-pack-perform',
    title: 'TOEIC® Pack Perform',
    hours: '20 heures',
    price: '1 500 €',
    pdfFileName: 'TOEIC_Pack_Perform_v1.9.pdf',
    category: 'toeic',
  }),
]

export const adultCourseDescriptions = adultCourseDescriptionsFallback

export const adultCourseDescriptionPdfUrlsByTitle = Object.fromEntries(
  adultCourseDescriptionsFallback.map((course) => [course.title, course.pdfUrl]),
) as Record<string, string>

export function getAdultCourseDescriptionsByCategory(category: AdultCourseDescriptionCategory) {
  return adultCourseDescriptionsFallback.filter((course) => course.category === category)
}

export function getQualiopiCourseDescriptions() {
  return adultCourseDescriptionsFallback.filter(
    (course) => course.category === 'pro' || course.category === 'toeic',
  )
}

export function getAdultCourseDescriptionPdfUrl(title: string) {
  return adultCourseDescriptionPdfUrlsByTitle[title]
}
