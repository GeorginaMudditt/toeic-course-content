/**
 * B1 is on the vocabulary board only for the demo student portal.
 * Other students, and a teacher viewing another student, still see “coming soon”.
 */
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const B1_VOCABULARY_RELEASED = true

const DEMO_STUDENT_EMAIL = 'student@example.com'

export function isDemoVocabularyStudent(
  user: { email?: string | null; name?: string | null } | null | undefined
): boolean {
  if (!user) return false
  const email = user.email?.trim().toLowerCase() ?? ''
  const name = user.name?.trim().toLowerCase() ?? ''
  return email === DEMO_STUDENT_EMAIL || name === 'demo student' || name.includes('demo')
}

async function userIsDemoStudent(userId: string): Promise<boolean> {
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, role: true },
  })
  return student?.role === 'STUDENT' && isDemoVocabularyStudent(student)
}

/** Whose vocabulary board is on screen: the logged-in student, or the learner a teacher/guardian is viewing. */
export async function isB1VocabularyVisibleForPortal(
  session: Session | null | undefined,
  viewAs?: string | null
): Promise<boolean> {
  if (!B1_VOCABULARY_RELEASED || !session?.user) return false
  const role = session.user.role

  if (role === 'STUDENT') {
    return isDemoVocabularyStudent(session.user)
  }

  if (role === 'TEACHER') {
    if (!viewAs) return false
    return userIsDemoStudent(viewAs)
  }

  if (role === 'GUARDIAN') {
    const childId = session.user.activeChildId
    if (!childId) return false
    if (viewAs && viewAs !== childId) return false
    return userIsDemoStudent(childId)
  }

  return false
}

export async function isB1ProgressAllowed(
  studentId: string,
  level: string | null | undefined
): Promise<boolean> {
  if (level?.toLowerCase() !== 'b1') return true
  return userIsDemoStudent(studentId)
}

/** Block B1 word, topic, icon, and list routes unless this request is the demo student portal. */
export async function b1VocabularyDeniedResponse(
  request: NextRequest,
  level: string
): Promise<NextResponse | null> {
  if (level !== 'b1') return null
  const session = await getServerSession(authOptions)
  const viewAs = request.nextUrl.searchParams.get('viewAs')
  const allowed = await isB1VocabularyVisibleForPortal(session, viewAs)
  if (allowed) return null
  return NextResponse.json(
    { data: [], error: 'This level is coming soon.' },
    { status: 403 }
  )
}
