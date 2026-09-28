import { supabaseServer } from '@/lib/supabase'

export type UpcomingLesson = {
  id: string
  lessonDate: string
  startTime: string
  endTime: string
  lessonType: string | null
}

export type PortalLessonInput = {
  websiteLessonId: string
  studentEmail: string
  studentName?: string | null
  date: string
  startTime: string
  endTime: string
  lessonType?: string | null
}

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})/

export function normalizeClockTime(raw: string): string | null {
  const match = String(raw).trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function normalizeLessonDate(raw: string): string | null {
  const match = String(raw).trim().match(DATE_KEY)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return `${match[1]}-${match[2]}-${match[3]}`
}

function parisTodayKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function parisNowMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

function clockToMinutes(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number)
  return hours * 60 + minutes
}

export function isUpcomingLesson(
  lessonDate: string,
  endTime: string,
  now = new Date()
): boolean {
  const today = parisTodayKey(now)
  if (lessonDate > today) return true
  if (lessonDate < today) return false
  return clockToMinutes(endTime) > parisNowMinutes(now)
}

export function formatLessonDate(lessonDate: string): string {
  const match = lessonDate.match(DATE_KEY)
  if (!match) return lessonDate
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatLessonType(lessonType: string | null | undefined): string | null {
  if (lessonType === 'online') return 'Online'
  if (lessonType === 'in-person') return 'In person'
  return null
}

export function formatLessonLength(startTime: string, endTime: string): string | null {
  const minutes = clockToMinutes(endTime) - clockToMinutes(startTime)
  if (minutes <= 0) return null
  if (minutes === 60) return '1 hour'
  if (minutes % 60 === 0) {
    const hours = minutes / 60
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  return `${minutes} minutes`
}

export async function loadUpcomingLessonsForStudent(studentId: string): Promise<UpcomingLesson[]> {
  const { data: student, error: studentError } = await supabaseServer
    .from('User')
    .select('email')
    .eq('id', studentId)
    .maybeSingle()

  if (studentError || !student?.email) return []

  const email = String(student.email).trim().toLowerCase()
  const today = parisTodayKey()
  const { data, error } = await supabaseServer
    .from('BookedLesson')
    .select('id, lessonDate, startTime, endTime, lessonType')
    .eq('studentEmail', email)
    .gte('lessonDate', today)
    .order('lessonDate', { ascending: true })
    .order('startTime', { ascending: true })

  if (error) {
    console.error('Error loading booked lessons:', error)
    return []
  }

  return (data || [])
    .map((row) => ({
      id: String(row.id),
      lessonDate: String(row.lessonDate).slice(0, 10),
      startTime: normalizeClockTime(String(row.startTime)) || String(row.startTime).slice(0, 5),
      endTime: normalizeClockTime(String(row.endTime)) || String(row.endTime).slice(0, 5),
      lessonType: row.lessonType ? String(row.lessonType) : null,
    }))
    .filter((lesson) => isUpcomingLesson(lesson.lessonDate, lesson.endTime))
}

export async function upsertBookedLesson(input: PortalLessonInput): Promise<{ error?: string }> {
  const websiteLessonId = input.websiteLessonId.trim()
  const studentEmail = input.studentEmail.trim().toLowerCase()
  const lessonDate = normalizeLessonDate(input.date)
  const startTime = normalizeClockTime(input.startTime)
  const endTime = normalizeClockTime(input.endTime)

  if (!websiteLessonId || !studentEmail || !lessonDate || !startTime || !endTime) {
    return { error: 'Invalid booking' }
  }

  const now = new Date().toISOString()
  const { data: existing } = await supabaseServer
    .from('BookedLesson')
    .select('id')
    .eq('websiteLessonId', websiteLessonId)
    .maybeSingle()

  const row = {
    id: existing?.id ?? crypto.randomUUID(),
    websiteLessonId,
    studentEmail,
    studentName: input.studentName?.trim() || null,
    lessonDate,
    startTime,
    endTime,
    lessonType: input.lessonType?.trim() || null,
    updatedAt: now,
    ...(existing ? {} : { createdAt: now }),
  }

  const { error } = await supabaseServer.from('BookedLesson').upsert(row, {
    onConflict: 'websiteLessonId',
  })

  if (error) return { error: error.message }
  return {}
}

export async function deleteBookedLesson(websiteLessonId: string): Promise<{ error?: string }> {
  const id = websiteLessonId.trim()
  if (!id) return { error: 'Invalid booking' }
  const { error } = await supabaseServer.from('BookedLesson').delete().eq('websiteLessonId', id)
  if (error) return { error: error.message }
  return {}
}
