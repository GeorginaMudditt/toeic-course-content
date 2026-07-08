import { NextRequest, NextResponse } from 'next/server'
import { generateVocabularyListPdf } from '@/lib/generate-vocabulary-list-pdf'
import {
  getVocabularyListEntriesForLevel,
  supportsGeneratedVocabularyList,
} from '@/lib/vocabulary-list-data'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const level = params.level.toLowerCase()

    if (!supportsGeneratedVocabularyList(level)) {
      return NextResponse.json(
        { error: 'Generated vocabulary list is not available for this level.' },
        { status: 404 }
      )
    }

    const entries = await getVocabularyListEntriesForLevel(level)

    if (!entries.length) {
      return NextResponse.json(
        { error: 'No vocabulary entries found for this level.' },
        { status: 404 }
      )
    }

    const pdfBytes = await generateVocabularyListPdf(level, entries)
    const fileName = `${level.toUpperCase()} vocabulary list.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    console.error('Error generating vocabulary list PDF:', error)
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
