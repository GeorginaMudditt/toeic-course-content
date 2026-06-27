import type { Session } from 'next-auth'
import { isGuardianChildLinked } from '@/lib/family-membership'

export type VocabularyStudentContext = {
  allowed: boolean
  studentId: string | null
  backHref: string
  isGuardian: boolean
  isTeacherView: boolean
  activeChildName: string | null
}

export async function resolveVocabularyStudentContext(
  session: Session | null,
  viewAs?: string | null
): Promise<VocabularyStudentContext> {
  if (!session?.user) {
    return {
      allowed: false,
      studentId: null,
      backHref: '/login',
      isGuardian: false,
      isTeacherView: false,
      activeChildName: null,
    }
  }

  const role = session.user.role

  if (role === 'TEACHER' && viewAs) {
    return {
      allowed: true,
      studentId: viewAs,
      backHref: `/teacher/students/${viewAs}/view`,
      isGuardian: false,
      isTeacherView: true,
      activeChildName: null,
    }
  }

  if (role === 'STUDENT') {
    return {
      allowed: true,
      studentId: session.user.id,
      backHref: '/student/dashboard',
      isGuardian: false,
      isTeacherView: false,
      activeChildName: null,
    }
  }

  if (role === 'GUARDIAN') {
    const activeChildId = session.user.activeChildId ?? null
    const activeChildName = session.user.activeChildName ?? null

    if (!activeChildId) {
      return {
        allowed: false,
        studentId: null,
        backHref: '/family',
        isGuardian: true,
        isTeacherView: false,
        activeChildName: null,
      }
    }

    const linked = await isGuardianChildLinked(session.user.id, activeChildId)
    if (!linked) {
      return {
        allowed: false,
        studentId: null,
        backHref: '/family',
        isGuardian: true,
        isTeacherView: false,
        activeChildName: null,
      }
    }

    return {
      allowed: true,
      studentId: activeChildId,
      backHref: '/family',
      isGuardian: true,
      isTeacherView: false,
      activeChildName,
    }
  }

  return {
    allowed: false,
    studentId: null,
    backHref: '/login',
    isGuardian: false,
    isTeacherView: false,
    activeChildName: null,
  }
}
