import { supabaseServer } from '@/lib/supabase'

export async function verifyTeacherEnrollment(enrollmentId: string, teacherId: string) {
  const { data: enrollment, error: enrollmentError } = await supabaseServer
    .from('Enrollment')
    .select('id, courseId')
    .eq('id', enrollmentId)
    .single()

  if (enrollmentError || !enrollment) {
    return { ok: false as const, status: 404, error: 'Course enrollment not found.' }
  }

  const { data: course, error: courseError } = await supabaseServer
    .from('Course')
    .select('id, creatorId')
    .eq('id', enrollment.courseId)
    .single()

  if (courseError || !course) {
    return { ok: false as const, status: 404, error: 'Course not found.' }
  }
  if (course.creatorId !== teacherId) {
    return { ok: false as const, status: 403, error: 'Forbidden' }
  }

  return { ok: true as const }
}
