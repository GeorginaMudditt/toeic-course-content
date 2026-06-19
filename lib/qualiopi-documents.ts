export type QualiopiDocumentCategory = 'key' | 'indicator'
export type QualiopiDocumentLayout = 'spreadsheet' | 'hub'
export type QualiopiFolderType = 'spreadsheet' | 'pdf-folder' | 'course-catalog'

export type CourseCatalogCategory = 'pro' | 'toeic' | 'daily'

export interface QualiopiFolder {
  slug: string
  title: string
  description: string
  type: QualiopiFolderType
  catalogCategory?: CourseCatalogCategory
}

export interface QualiopiDocument {
  slug: string
  title: string
  description: string
  spreadsheetId: string
  category: QualiopiDocumentCategory
  indicatorOrder?: number
  layout?: QualiopiDocumentLayout
  folders?: QualiopiFolder[]
}

export const qualiopiDocuments: QualiopiDocument[] = [
  {
    slug: 'actions-annual-calendar',
    title: 'Qualiopi actions annual calendar',
    description: 'Track and update your annual Qualiopi action plan.',
    spreadsheetId: '1CPNRYg8cXZR4bqOi3ITwuJIu7Y7mm3aTeJWSmq_qGzA',
    category: 'key',
  },
  {
    slug: 'course-content',
    title: 'Course Content',
    description: 'Resource tracking',
    spreadsheetId: '142HnXGXVHpww_JmYHcK-9nVdtH0Olv21RM5MRmqHefY',
    category: 'key',
  },
  {
    slug: 'indicator-1',
    title: 'Qualiopi Indicator 1',
    description: 'Public-Facing Information',
    spreadsheetId: '1g94591Z0TM3pQJ1kFxC4F0I_w6ltf4a2SL5t7Llq2AY',
    category: 'indicator',
    indicatorOrder: 1,
    layout: 'hub',
    folders: [
      {
        slug: 'course-descriptions',
        title: 'Course descriptions',
        description: 'Download current PRO Pack and TOEIC Pack course descriptions',
        type: 'course-catalog',
      },
      {
        slug: 'website-modification-spreadsheet',
        title: 'Go to website modification spreadsheet',
        description: 'View and update the website modification tracking spreadsheet.',
        type: 'spreadsheet',
      },
    ],
  },
  {
    slug: 'indicator-2',
    title: 'Qualiopi Indicator 2',
    description: 'Student satisfaction on website',
    spreadsheetId: '1ZSdt_O73sw0iDfyQdJTBeJx0ktiaRMfCO2PBht2V8k0',
    category: 'indicator',
    indicatorOrder: 2,
  },
  {
    slug: 'indicator-12',
    title: 'Qualiopi Indicator 12',
    description: 'Student engagement',
    spreadsheetId: '1G8F2JfVmA8gBwkzVxHED9gKgNaRQCGSG1Q0cY29VPLU',
    category: 'indicator',
    indicatorOrder: 12,
  },
  {
    slug: 'indicator-22',
    title: 'Qualiopi Indicator 22',
    description: 'Continual Professional Development',
    spreadsheetId: '1Dr9b-rJdlhtX5DoeGleq6mTtPWGup6G9_2o_BfPq3j4',
    category: 'indicator',
    indicatorOrder: 22,
  },
  {
    slug: 'indicators-23-24-25',
    title: 'Qualiopi Indicators 23, 24 & 25',
    description: 'Professional practice monitoring',
    spreadsheetId: '1qQvrsJ7g2I_1-KGYkxf3foO_oqmnudpuCsshjJ1ZSmo',
    category: 'indicator',
    indicatorOrder: 23,
  },
  {
    slug: 'indicator-32',
    title: 'Qualiopi Indicator 32',
    description: 'Continuous improvement based on feedback',
    spreadsheetId: '1FEIk_q1PuRqxc2vS0a776bp5dyJbRkhmrMpFDREoGF8',
    category: 'indicator',
    indicatorOrder: 32,
  },
]

export function getQualiopiDocumentsByCategory(category: QualiopiDocumentCategory) {
  const documents = qualiopiDocuments.filter((document) => document.category === category)

  if (category === 'indicator') {
    return [...documents].sort(
      (a, b) => (a.indicatorOrder ?? 999) - (b.indicatorOrder ?? 999),
    )
  }

  return documents
}

export function getQualiopiDocument(slug: string) {
  return qualiopiDocuments.find((document) => document.slug === slug)
}

export function getQualiopiFolder(indicatorSlug: string, folderSlug: string) {
  const document = getQualiopiDocument(indicatorSlug)
  return document?.folders?.find((folder) => folder.slug === folderSlug)
}

export function isQualiopiHub(document: QualiopiDocument) {
  return document.layout === 'hub'
}

export function getGoogleSheetEmbedUrl(spreadsheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing&rm=minimal`
}

export function getGoogleSheetEditUrl(spreadsheetId: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`
}
