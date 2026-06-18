export type QualiopiDocumentCategory = 'key' | 'indicator'
export type QualiopiDocumentLayout = 'spreadsheet' | 'hub'
export type QualiopiFolderType = 'spreadsheet' | 'pdf-folder'

export interface QualiopiFolder {
  slug: string
  title: string
  description: string
  type: QualiopiFolderType
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
    description: 'Continuing Professional Development',
    spreadsheetId: '1Dr9b-rJdlhtX5DoeGleq6mTtPWGup6G9_2o_BfPq3j4',
    category: 'indicator',
    indicatorOrder: 22,
    layout: 'hub',
    folders: [
      {
        slug: 'spreadsheet',
        title: 'Spreadsheet',
        description: 'View and update the Indicator 22 tracking spreadsheet.',
        type: 'spreadsheet',
      },
      {
        slug: 'completion-certificates',
        title: 'Completion Certificates',
        description: 'Upload and manage CPD completion certificate PDFs.',
        type: 'pdf-folder',
      },
    ],
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
