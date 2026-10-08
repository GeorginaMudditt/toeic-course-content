import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { parseResourceWrite } from '@/lib/english-outside-class'
import { insertResourceRow, markSuggestion } from '@/lib/english-outside-store'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = parseResourceWrite(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const suggestionId = typeof body.suggestionId === 'string' ? body.suggestionId : null
    const now = new Date().toISOString()
    const id = randomUUID()

    const { error } = await insertResourceRow({
      id,
      ...parsed.data,
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now,
    })

    if (error) {
      console.error('Error creating English Outside resource:', error)
      return NextResponse.json({ error: 'Could not save that title.' }, { status: 500 })
    }

    if (suggestionId) {
      const { error: suggestionError } = await markSuggestion(
        suggestionId,
        {
          status: 'ADDED',
          createdResourceId: id,
          updatedAt: now,
        },
        'PENDING'
      )

      if (suggestionError) {
        console.error('Resource saved but suggestion was not marked added:', suggestionError)
      }
    }

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error in POST /api/english-outside-class:', error)
    return NextResponse.json({ error: 'Could not save that title.' }, { status: 500 })
  }
}
