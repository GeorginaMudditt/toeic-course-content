import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { findPublishedResource, upsertRatingRow } from '@/lib/english-outside-store'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const stars = body.stars
    if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 })
    }

    const { found, error: resourceError } = await findPublishedResource(params.id)
    if (resourceError || !found) {
      return NextResponse.json({ error: 'That title is not on the list.' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const { error } = await upsertRatingRow({
      id: randomUUID(),
      resourceId: params.id,
      studentId: session.user.id,
      stars,
      createdAt: now,
      updatedAt: now,
    })
    if (error) {
      console.error('Error saving rating:', error)
      return NextResponse.json({ error: 'Could not save your rating.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST rating:', error)
    return NextResponse.json({ error: 'Could not save your rating.' }, { status: 500 })
  }
}
