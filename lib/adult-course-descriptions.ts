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
]

export const adultCourseDescriptionPdfUrlsByTitle = Object.fromEntries(
  adultCourseDescriptions.map((course) => [course.title, course.pdfUrl]),
) as Record<string, string>

export function getAdultCourseDescriptionsByCategory(category: AdultCourseDescriptionCategory) {
  return adultCourseDescriptions.filter((course) => course.category === category)
}

export function getAdultCourseDescriptionPdfUrl(title: string) {
  return adultCourseDescriptionPdfUrlsByTitle[title]
}
