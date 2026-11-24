const LESSON_BOOKING_CODES = [
  { name: 'Hugo Arnoult', code: '78HJBVLV' },
  { name: 'Anna Raikova', code: '6XWPHYST' },
  { name: 'Xavier Simon', code: 'HXP47KUL' },
  { name: 'Dovile KEDIKAITE', code: 'DM5RUG7Q' },
  { name: 'Fatima OUALI', code: 'G2GEUN45' },
  { name: 'Thomas TINEL', code: 'E89Z9QEY' },
] as const

function normalizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function getLessonBookingCode(studentName: string | null | undefined): string | null {
  if (!studentName) return null
  const normalized = normalizeName(studentName)
  return LESSON_BOOKING_CODES.find((entry) => normalizeName(entry.name) === normalized)?.code ?? null
}
