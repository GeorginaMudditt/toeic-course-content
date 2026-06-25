import { supabaseServer } from '@/lib/supabase'

export type VocabularyProgressStudentRow = {
  id: string
  name: string
  email: string
  vocabularyProgressArchived: boolean
}

function isMissingVocabularyProgressArchivedColumn(
  error: { message?: string; code?: string } | null
) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  return (
    message.includes('vocabularyprogressarchived') ||
    (message.includes('column') && message.includes('does not exist'))
  )
}

export async function loadVocabularyProgressStudentRows(): Promise<VocabularyProgressStudentRow[]> {
  const withArchiveColumn = await supabaseServer
    .from('User')
    .select('id, name, email, vocabularyProgressArchived')
    .eq('role', 'STUDENT')
    .order('name', { ascending: true })

  if (!withArchiveColumn.error && withArchiveColumn.data) {
    return withArchiveColumn.data.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      vocabularyProgressArchived: row.vocabularyProgressArchived === true,
    }))
  }

  if (!isMissingVocabularyProgressArchivedColumn(withArchiveColumn.error)) {
    console.error('Error loading vocabulary progress students:', withArchiveColumn.error)
    return []
  }

  const withoutArchiveColumn = await supabaseServer
    .from('User')
    .select('id, name, email')
    .eq('role', 'STUDENT')
    .order('name', { ascending: true })

  if (withoutArchiveColumn.error) {
    console.error('Error loading vocabulary progress students:', withoutArchiveColumn.error)
    return []
  }

  return (withoutArchiveColumn.data || []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    vocabularyProgressArchived: false,
  }))
}

export function isVocabularyProgressArchived(value: boolean | null | undefined): boolean {
  return value === true
}
