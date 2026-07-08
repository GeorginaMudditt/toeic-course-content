import { readFileSync } from 'fs'
import { join } from 'path'
import { jsPDF } from 'jspdf'
import { brizzleRed } from '@/lib/brand-colors'
import { LEVEL_COLORS } from '@/lib/level-colors'
import type { VocabularyListEntry } from '@/lib/vocabulary-list-data'

const FONT_URLS = {
  regular:
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
  bold: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
  italic:
    'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Italic.ttf',
} as const

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 12
const MARGIN_TOP = 12
const FOOTER_Y = 287
const COLUMN_GAP = 10
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN_X * 2 - COLUMN_GAP) / 2
const ENGLISH_WIDTH = 36
const FRENCH_X_OFFSET = 38
const LINE_HEIGHT = 5.2
const WRAP_LINE_HEIGHT = 4.2
const FONT_SIZE = 10
const LINE_HEIGHT_FACTOR = 1.15
const LINES_FIRST_PAGE = 38
const LINES_OTHER_PAGES = 48

type FontSet = {
  regular: string
  bold: string
  italic: string
}

let fontCache: FontSet | null = null

async function loadFonts(): Promise<FontSet> {
  if (fontCache) return fontCache

  const [regularRes, boldRes, italicRes] = await Promise.all([
    fetch(FONT_URLS.regular),
    fetch(FONT_URLS.bold),
    fetch(FONT_URLS.italic),
  ])

  if (!regularRes.ok || !boldRes.ok || !italicRes.ok) {
    throw new Error('Failed to load PDF fonts')
  }

  fontCache = {
    regular: Buffer.from(await regularRes.arrayBuffer()).toString('base64'),
    bold: Buffer.from(await boldRes.arrayBuffer()).toString('base64'),
    italic: Buffer.from(await italicRes.arrayBuffer()).toString('base64'),
  }

  return fontCache
}

function loadLogoDataUri(): string {
  const logoPath = join(process.cwd(), 'public', 'brizzle-logo.png')
  const logoBuffer = readFileSync(logoPath)
  return `data:image/png;base64,${logoBuffer.toString('base64')}`
}

function registerFonts(doc: jsPDF, fonts: FontSet) {
  doc.addFileToVFS('NotoSans-Regular.ttf', fonts.regular)
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  doc.addFileToVFS('NotoSans-Bold.ttf', fonts.bold)
  doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')
  doc.addFileToVFS('NotoSans-Italic.ttf', fonts.italic)
  doc.addFont('NotoSans-Italic.ttf', 'NotoSans', 'italic')
}

function drawFooter(doc: jsPDF) {
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(brizzleRed)
  doc.text('www.brizzle-english.com', PAGE_WIDTH / 2, FOOTER_Y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

function drawPageNumber(doc: jsPDF, pageNumber: number) {
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(String(pageNumber), PAGE_WIDTH - MARGIN_X, MARGIN_TOP, { align: 'right' })
  doc.setTextColor(0, 0, 0)
}

function drawEntry(
  doc: jsPDF,
  entry: VocabularyListEntry,
  columnX: number,
  y: number
) {
  doc.setFontSize(FONT_SIZE)
  doc.setLineHeightFactor(LINE_HEIGHT_FACTOR)
  doc.setFont('NotoSans', 'bold')
  doc.setTextColor(0, 0, 0)

  const englishLines = doc.splitTextToSize(entry.word_english, ENGLISH_WIDTH)
  doc.text(englishLines, columnX, y, { lineHeightFactor: LINE_HEIGHT_FACTOR })

  doc.setFont('NotoSans', 'italic')
  doc.setTextColor(70, 70, 70)
  const frenchLines = doc.splitTextToSize(
    entry.translation_french,
    COLUMN_WIDTH - FRENCH_X_OFFSET
  )
  doc.text(frenchLines, columnX + FRENCH_X_OFFSET, y, {
    lineHeightFactor: LINE_HEIGHT_FACTOR,
  })
  doc.setTextColor(0, 0, 0)

  const rowLines = Math.max(englishLines.length, frenchLines.length)
  return y + LINE_HEIGHT + (rowLines - 1) * WRAP_LINE_HEIGHT
}

function chunkEntriesForPage(
  entries: VocabularyListEntry[],
  linesPerColumn: number
): {
  pageEntries: VocabularyListEntry[]
  remaining: VocabularyListEntry[]
} {
  const capacity = linesPerColumn * 2
  const pageEntries = entries.slice(0, capacity)
  const remaining = entries.slice(capacity)
  return { pageEntries, remaining }
}

function drawPageEntries(
  doc: jsPDF,
  entries: VocabularyListEntry[],
  startY: number,
  linesPerColumn: number
) {
  const leftEntries = entries.slice(0, linesPerColumn)
  const rightEntries = entries.slice(linesPerColumn, linesPerColumn * 2)
  const leftX = MARGIN_X
  const rightX = MARGIN_X + COLUMN_WIDTH + COLUMN_GAP

  let leftY = startY
  for (const entry of leftEntries) {
    leftY = drawEntry(doc, entry, leftX, leftY)
  }

  let rightY = startY
  for (const entry of rightEntries) {
    rightY = drawEntry(doc, entry, rightX, rightY)
  }
}

function drawFirstPageHeader(
  doc: jsPDF,
  levelDisplay: string,
  levelColor: string,
  logoDataUri: string
) {
  const logoSize = 22
  const logoX = (PAGE_WIDTH - logoSize) / 2
  doc.addImage(logoDataUri, 'PNG', logoX, 18, logoSize, logoSize)

  doc.setFont('NotoSans', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(levelColor)
  doc.text(`${levelDisplay} Vocabulary List`, PAGE_WIDTH / 2, 48, {
    align: 'center',
  })
  doc.setTextColor(0, 0, 0)
}

export async function generateVocabularyListPdf(
  level: string,
  entries: VocabularyListEntry[]
): Promise<ArrayBuffer> {
  const fonts = await loadFonts()
  const logoDataUri = loadLogoDataUri()
  const levelDisplay = level.toUpperCase()
  const levelColor =
    LEVEL_COLORS[levelDisplay as keyof typeof LEVEL_COLORS] ?? brizzleRed

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registerFonts(doc, fonts)

  let remaining = entries
  let pageNumber = 1

  while (remaining.length > 0 || pageNumber === 1) {
    if (pageNumber > 1) {
      doc.addPage()
    }

    drawPageNumber(doc, pageNumber)
    drawFooter(doc)

    const linesPerColumn =
      pageNumber === 1 ? LINES_FIRST_PAGE : LINES_OTHER_PAGES
    const startY = pageNumber === 1 ? 58 : 20

    if (pageNumber === 1) {
      drawFirstPageHeader(doc, levelDisplay, levelColor, logoDataUri)
    }

    const { pageEntries, remaining: nextRemaining } = chunkEntriesForPage(
      remaining,
      linesPerColumn
    )

    if (pageEntries.length > 0) {
      drawPageEntries(doc, pageEntries, startY, linesPerColumn)
    }

    remaining = nextRemaining
    pageNumber += 1

    if (pageEntries.length === 0) break
  }

  return doc.output('arraybuffer')
}
