import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { sendEnglishOutsideSuggestionEmail } from '@/lib/email'
import {
  ENGLISH_OUTSIDE_FORMATS,
  labelFor,
  parseSuggestionWrite,
} from '@/lib/english-outside-class'
import { insertSuggestionRow } from '@/lib/english-outside-store'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = parseSuggestionWrite(await request.json())
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const now = new Date().toISOString()
    const id = randomUUID()
    const { error } = await insertSuggestionRow({
      id,
      studentId: session.user.id,
      studentName: session.user.name || 'Student',
      ...parsed.data,
      status: 'PENDING',
      createdResourceId: null,
      createdAt: now,
      updatedAt: now,
    })

    if (error) {
      console.error('Error saving English Outside suggestion:', error)
      return NextResponse.json({ error: 'Could not send your suggestion.' }, { status: 500 })
    }

    await sendEnglishOutsideSuggestionEmail({
      studentName: session.user.name || 'Student',
      studentEmail: session.user.email,
      title: parsed.data.title,
      formatLabel: labelFor(ENGLISH_OUTSIDE_FORMATS, parsed.data.format),
      url: parsed.data.url,
      whereToFind: parsed.data.whereToFind,
      whyRecommend: parsed.data.whyRecommend,
      studentContentNote: parsed.data.studentContentNote,
    })

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error in POST /api/english-outside-class/suggestions:', error)
    return NextResponse.json({ error: 'Could not send your suggestion.' }, { status: 500 })
  }
}
