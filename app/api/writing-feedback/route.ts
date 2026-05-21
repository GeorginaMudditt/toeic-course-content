import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'
import {
  generateAiFeedback,
  isWritingTaskType,
  runStructuralChecks,
  type WritingTaskType,
} from '@/lib/writing-feedback'

const RATE_LIMIT_MS = 60_000
const MAX_TEXT_LENGTH = 8000

function getRateLimitKey(task: WritingTaskType): string {
  return `writing-feedback-${task}-at`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, taskType, text } = body

    if (!assignmentId || typeof assignmentId !== 'string') {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })
    }

    if (!isWritingTaskType(taskType)) {
      return NextResponse.json({ error: 'Invalid task type' }, { status: 400 })
    }

    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Please write your answer before requesting feedback.' }, { status: 400 })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: 'Text is too long for feedback.' }, { status: 400 })
    }

    const { data: assignmentData, error: assignmentError } = await supabaseServer
      .from('Assignment')
      .select('id, enrollmentId')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignmentData) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('studentId')
      .eq('id', assignmentData.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    if (enrollmentData.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: progressData } = await supabaseServer
      .from('Progress')
      .select('notes')
      .eq('assignmentId', assignmentId)
      .eq('studentId', session.user.id)
      .maybeSingle()

    let notesObj: Record<string, unknown> = {}
    if (progressData?.notes) {
      try {
        notesObj = JSON.parse(progressData.notes) as Record<string, unknown>
      } catch {
        notesObj = {}
      }
    }

    const rateKey = getRateLimitKey(taskType)
    const lastAt = notesObj[rateKey]
    if (typeof lastAt === 'string') {
      const elapsed = Date.now() - new Date(lastAt).getTime()
      if (elapsed < RATE_LIMIT_MS) {
        const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)
        return NextResponse.json(
          {
            error: `Please wait ${waitSec} seconds before requesting feedback again.`,
            structural: runStructuralChecks(taskType, text),
          },
          { status: 429 }
        )
      }
    }

    const structural = runStructuralChecks(taskType, text)

    try {
      const result = await generateAiFeedback(taskType, text, structural)
      return NextResponse.json({
        structural,
        aiFeedback: result.text,
        aiSource: result.source,
        aiSourceNote: result.sourceNote,
        generatedAt: new Date().toISOString(),
        rateLimitKey: rateKey,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI feedback failed'
      if (message.includes('GEMINI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI feedback is not configured yet. Please ask your teacher.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: message, structural }, { status: 502 })
    }
  } catch (error) {
    console.error('Writing feedback error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
