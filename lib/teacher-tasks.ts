export type TeacherTaskStatus = 'OPEN' | 'DONE'

export type TeacherTask = {
  id: string
  teacherId: string
  title: string
  status: TeacherTaskStatus
  sortOrder: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export function isTeacherTaskStatus(value: unknown): value is TeacherTaskStatus {
  return value === 'OPEN' || value === 'DONE'
}
