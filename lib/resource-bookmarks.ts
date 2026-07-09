import { supabaseServer } from '@/lib/supabase'

export interface ResourceBookmarkRow {
  id: string
  studentId: string
  assignmentId: string
  resourceId: string
  sectionSlug: string
  sectionLabel: string
  createdAt: string
}

export interface SavedSectionCard {
  id: string
  assignmentId: string
  resourceId: string
  sectionSlug: string
  sectionLabel: string
  resourceTitle: string
  createdAt: string
}

export async function getBookmarksForStudent(studentId: string): Promise<ResourceBookmarkRow[]> {
  const { data, error } = await supabaseServer
    .from('ResourceBookmark')
    .select('*')
    .eq('studentId', studentId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error loading bookmarks:', error)
    return []
  }

  return (data || []) as ResourceBookmarkRow[]
}

export async function getBookmarksForAssignment(
  studentId: string,
  assignmentId: string
): Promise<ResourceBookmarkRow[]> {
  const { data, error } = await supabaseServer
    .from('ResourceBookmark')
    .select('*')
    .eq('studentId', studentId)
    .eq('assignmentId', assignmentId)

  if (error) {
    console.error('Error loading assignment bookmarks:', error)
    return []
  }

  return (data || []) as ResourceBookmarkRow[]
}

export async function getSavedSectionsForDashboard(
  studentId: string
): Promise<SavedSectionCard[]> {
  const bookmarks = await getBookmarksForStudent(studentId)
  if (bookmarks.length === 0) return []

  const resourceIds = [...new Set(bookmarks.map((b) => b.resourceId))]
  const { data: resources, error } = await supabaseServer
    .from('Resource')
    .select('id, title')
    .in('id', resourceIds)

  if (error) {
    console.error('Error loading bookmark resources:', error)
    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      assignmentId: bookmark.assignmentId,
      resourceId: bookmark.resourceId,
      sectionSlug: bookmark.sectionSlug,
      sectionLabel: bookmark.sectionLabel,
      resourceTitle: 'Saved resource',
      createdAt: bookmark.createdAt,
    }))
  }

  const titleById = new Map((resources || []).map((r) => [r.id, r.title as string]))

  return bookmarks.map((bookmark) => ({
    id: bookmark.id,
    assignmentId: bookmark.assignmentId,
    resourceId: bookmark.resourceId,
    sectionSlug: bookmark.sectionSlug,
    sectionLabel: bookmark.sectionLabel,
    resourceTitle: titleById.get(bookmark.resourceId) || 'Saved resource',
    createdAt: bookmark.createdAt,
  }))
}
