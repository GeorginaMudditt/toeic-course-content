import type { Session } from 'next-auth'
import { isGuardianChildLinked } from '@/lib/family-membership'

export type VocabularyProgressTarget =
  | { ok: true; studentId: string }
  | { ok: false; status: number; error: string }

export async function resolveVocabularyProgressTarget(
  session: Session,
  studentIdParam: string | null
): Promise<VocabularyProgressTarget> {
  const role = session.user.role

  if (role === 'TEACHER') {
    if (!studentIdParam) {
      return { ok: false, status: 400, error: 'studentId is required for teacher access' }
    }
    return { ok: true, studentId: studentIdParam }
  }

  if (role === 'STUDENT') {
    if (studentIdParam && studentIdParam !== session.user.id) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
    return { ok: true, studentId: session.user.id }
  }

  if (role === 'GUARDIAN') {
    const activeChildId = session.user.activeChildId
    if (!activeChildId) {
      return { ok: false, status: 403, error: 'No learner selected' }
    }
    if (studentIdParam && studentIdParam !== activeChildId) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
    const linked = await isGuardianChildLinked(session.user.id, activeChildId)
    if (!linked) {
      return { ok: false, status: 403, error: 'Forbidden' }
    }
    return { ok: true, studentId: activeChildId }
  }

  return { ok: false, status: 403, error: 'Forbidden' }
}

export function canWriteVocabularyProgress(session: Session): boolean {
  return session.user.role === 'STUDENT' || session.user.role === 'GUARDIAN'
}
