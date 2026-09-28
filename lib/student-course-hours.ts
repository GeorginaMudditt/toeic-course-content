import {
  computePackageProgress,
  parseCourseDurationHours,
  type NotesRowWithDate,
} from '@/lib/course-notes-lessons'
import { formatCourseName } from '@/lib/date-utils'
import { supabaseServer } from '@/lib/supabase'

export type CourseHourPanel = {
  enrollmentId: string
  courseLabel: string
  totalHours: number
  hoursLogged: number
}

export function summarizeCourseHours(
  content: string | null | undefined,
  rawDuration: unknown
): { totalHours: number; hoursLogged: number } {
  const totalHours = parseCourseDurationHours(rawDuration)
  let rows: NotesRowWithDate[] = []
  if (content && totalHours > 0) {
    try {
      const parsed = JSON.parse(content) as { version?: unknown; rows?: NotesRowWithDate[] }
      if (Number(parsed?.version) === 1 && Array.isArray(parsed.rows)) {
        rows = parsed.rows
      }
    } catch {
      rows = []
    }
  }
  const { hoursLogged } = computePackageProgress(rows, totalHours)
  return { totalHours, hoursLogged }
}

/** Hour totals for each enrolled course that has a package length. */
export async function loadCourseHourPanels(studentId: string): Promise<CourseHourPanel[]> {
  const { data: enrollmentData, error } = await supabaseServer
    .from('Enrollment')
    .select('id, courseId')
    .eq('studentId', studentId)

  if (error || !enrollmentData?.length) return []

  const courseIds = enrollmentData.map((enrollment) => enrollment.courseId)
  const enrollmentIds = enrollmentData.map((enrollment) => enrollment.id)

  const [{ data: courses }, { data: notes }] = await Promise.all([
    supabaseServer.from('Course').select('id, name, duration').in('id', courseIds),
    supabaseServer.from('CourseNote').select('enrollmentId, content').in('enrollmentId', enrollmentIds),
  ])

  const courseById = new Map((courses || []).map((course) => [course.id, course]))
  const noteByEnrollment = new Map(
    (notes || []).map((note) => [note.enrollmentId, note.content as string])
  )

  return enrollmentData.flatMap((enrollment) => {
    const course = courseById.get(enrollment.courseId)
    if (!course) return []
    const { totalHours, hoursLogged } = summarizeCourseHours(
      noteByEnrollment.get(enrollment.id) ?? null,
      course.duration
    )
    if (totalHours <= 0) return []
    return [
      {
        enrollmentId: enrollment.id,
        courseLabel: formatCourseName(course.name, totalHours),
        totalHours,
        hoursLogged,
      },
    ]
  })
}
