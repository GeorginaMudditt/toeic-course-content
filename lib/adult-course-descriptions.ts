/**
 * Synced from new-brizzle-website/lib/adult-course-descriptions.ts
 * Run `npm run sync:course-descriptions` after updating PDF URLs on the website.
 */

export type AdultCourseDescriptionCategory = 'pro' | 'toeic' | 'daily'

export interface AdultCourseDescription {
  slug: string
  title: string
  hours: string
  price: string
  pdfUrl: string
  category: AdultCourseDescriptionCategory
}

const COURSE_DESCRIPTIONS_BASE_URL =
  'https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/public/adult-course-descriptions'

export const adultCourseDescriptions: AdultCourseDescription[] = [
  {
    slug: 'pro-pack-launch',
    title: 'PRO Pack Launch',
    hours: '10 heures',
    price: '750 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/PRO_Pack_Launch.pdf`,
    category: 'pro',
  },
  {
    slug: 'pro-pack-scale',
    title: 'PRO Pack Scale',
    hours: '20 heures',
    price: '1 400 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/PRO_Pack_Scale.pdf`,
    category: 'pro',
  },
  {
    slug: 'pro-pack-lead',
    title: 'PRO Pack Lead',
    hours: '40 heures',
    price: '2 600 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/PRO_Pack_Lead.pdf`,
    category: 'pro',
  },
  {
    slug: 'speak-english-with-confidence',
    title: 'Speak English with Confidence',
    hours: '10 heures',
    price: '400 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/Speak_English_with_Confidence.pdf`,
    category: 'daily',
  },
  {
    slug: 'travel-english',
    title: 'Travel English',
    hours: '10 heures',
    price: '400 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/Travel_English.pdf`,
    category: 'daily',
  },
  {
    slug: 'serve-and-sell-in-english',
    title: 'Serve and Sell in English',
    hours: '10 heures',
    price: '400 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/Serve_and_Sell_in_English.pdf`,
    category: 'daily',
  },
  {
    slug: 'toeic-pack-progress',
    title: 'TOEIC® Pack Progress',
    hours: '15 heures',
    price: '1 200 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/TOEIC_Pack_Progress.pdf`,
    category: 'toeic',
  },
  {
    slug: 'toeic-pack-perform',
    title: 'TOEIC® Pack Perform',
    hours: '20 heures',
    price: '1 500 €',
    pdfUrl: `${COURSE_DESCRIPTIONS_BASE_URL}/TOEIC_Pack_Perform.pdf`,
    category: 'toeic',
  },
]

export const adultCourseDescriptionPdfUrlsByTitle = Object.fromEntries(
  adultCourseDescriptions.map((course) => [course.title, course.pdfUrl]),
) as Record<string, string>

export function getAdultCourseDescriptionsByCategory(category: AdultCourseDescriptionCategory) {
  return adultCourseDescriptions.filter((course) => course.category === category)
}

export function getQualiopiCourseDescriptions() {
  return adultCourseDescriptions.filter(
    (course) => course.category === 'pro' || course.category === 'toeic',
  )
}

export function getAdultCourseDescriptionPdfUrl(title: string) {
  return adultCourseDescriptionPdfUrlsByTitle[title]
}
