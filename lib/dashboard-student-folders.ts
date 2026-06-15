import { normalizeStudentLifecycleStatus } from '@/lib/student-lifecycle-status'
import { supabaseServer } from '@/lib/supabase'

export type DashboardStudentRow = {
  id: string
  name: string
  studentLifecycleStatus: string | null
  dashboardFolderArchived: boolean | null
}

function normalizeDashboardStudentRow(
  row: Record<string, unknown>
): DashboardStudentRow {
  return {
    id: String(row.id),
    name: String(row.name),
    studentLifecycleStatus:
      typeof row.studentLifecycleStatus === 'string' ? row.studentLifecycleStatus : null,
    dashboardFolderArchived:
      typeof row.dashboardFolderArchived === 'boolean' ? row.dashboardFolderArchived : false,
  }
}

function isMissingDashboardFolderArchivedColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return (
    message.includes('dashboardfolderarchived') ||
    message.includes('column') && message.includes('does not exist')
  )
}

export async function loadDashboardStudentRows(): Promise<DashboardStudentRow[]> {
  const withArchiveColumn = await supabaseServer
    .from('User')
    .select('id, name, studentLifecycleStatus, dashboardFolderArchived')
    .eq('role', 'STUDENT')
    .order('name', { ascending: true })

  if (!withArchiveColumn.error && withArchiveColumn.data) {
    return withArchiveColumn.data.map((row) =>
      normalizeDashboardStudentRow(row as Record<string, unknown>)
    )
  }

  if (!isMissingDashboardFolderArchivedColumn(withArchiveColumn.error)) {
    console.error('Error loading dashboard students:', withArchiveColumn.error)
    return []
  }

  const withoutArchiveColumn = await supabaseServer
    .from('User')
    .select('id, name, studentLifecycleStatus')
    .eq('role', 'STUDENT')
    .order('name', { ascending: true })

  if (withoutArchiveColumn.error) {
    console.error('Error loading dashboard students:', withoutArchiveColumn.error)
    return []
  }

  return (withoutArchiveColumn.data || []).map((row) =>
    normalizeDashboardStudentRow({
      ...row,
      dashboardFolderArchived: false,
    })
  )
}

export function isDashboardFolderArchived(value: boolean | null | undefined): boolean {
  return value === true
}

/** Students shown as active folders on the teacher dashboard. */
export function isVisibleOnDashboard(student: DashboardStudentRow): boolean {
  const status = normalizeStudentLifecycleStatus(student.studentLifecycleStatus)
  return status === 'ACTIVE_STUDENT' && !isDashboardFolderArchived(student.dashboardFolderArchived)
}

/** Students shown inside the dashboard Archive folder. */
export function isInDashboardArchive(student: DashboardStudentRow): boolean {
  const status = normalizeStudentLifecycleStatus(student.studentLifecycleStatus)
  return (
    isDashboardFolderArchived(student.dashboardFolderArchived) || status === 'PAST_STUDENT'
  )
}

export function canUnarchiveDashboardFolder(student: DashboardStudentRow): boolean {
  return isDashboardFolderArchived(student.dashboardFolderArchived)
}
