import {
  firstName,
  type LibraryResource,
  type TeacherPendingComment,
  type TeacherResource,
  type TeacherSuggestion,
} from '@/lib/english-outside-class'
import {
  listCommentRows,
  listRatingRows,
  listResourceRows,
  listSuggestionRows,
  type CommentRow,
} from '@/lib/english-outside-store'

function average(stars: number[]): number | null {
  if (stars.length === 0) return null
  const avg = stars.reduce((sum, value) => sum + value, 0) / stars.length
  return Math.round(avg * 10) / 10
}

export async function countPublishedEnglishOutside(): Promise<number | null> {
  try {
    const { rows, error } = await listResourceRows('PUBLISHED')
    if (error) return null
    return rows.length
  } catch {
    return null
  }
}

export async function loadEnglishOutsideLibrary(studentId: string | null): Promise<{
  resources: LibraryResource[]
  error: string | null
  missingTable: boolean
}> {
  const { rows: resources, error, missingTable } = await listResourceRows('PUBLISHED')

  if (error) {
    return {
      resources: [],
      error: missingTable ? null : 'The list could not be loaded.',
      missingTable: Boolean(missingTable),
    }
  }

  const ids = resources.map((resource) => resource.id)
  const { rows: ratings, error: ratingError } = await listRatingRows(ids)
  if (ratingError) {
    return { resources: [], error: 'The list could not be loaded.', missingTable: false }
  }

  let comments: CommentRow[] = []
  if (ids.length > 0) {
    const approved = await listCommentRows({ resourceIds: ids, statuses: ['APPROVED'] })
    if (approved.error) {
      return { resources: [], error: 'The list could not be loaded.', missingTable: false }
    }
    comments = approved.rows

    if (studentId) {
      const pending = await listCommentRows({
        resourceIds: ids,
        statuses: ['PENDING'],
        studentId,
      })
      if (pending.error) {
        return { resources: [], error: 'The list could not be loaded.', missingTable: false }
      }
      comments = comments.concat(pending.rows)
    }
  }

  return {
    resources: resources.map((resource) => {
      const resourceRatings = ratings.filter((rating) => rating.resourceId === resource.id)
      const mine = studentId ? resourceRatings.find((rating) => rating.studentId === studentId) : undefined
      return {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        format: resource.format,
        whereToFind: resource.whereToFind,
        level: resource.level,
        topicTags: resource.topicTags || [],
        contentNotes: resource.contentNotes || [],
        suggestedByName: resource.suggestedByName,
        createdAt: resource.createdAt,
        averageRating: average(resourceRatings.map((rating) => rating.stars)),
        ratingCount: resourceRatings.length,
        myRating: mine ? mine.stars : null,
        comments: comments
          .filter((comment) => comment.resourceId === resource.id)
          .map((comment) => ({
            id: comment.id,
            studentName: firstName(comment.studentName),
            body: comment.body,
            pending: comment.status === 'PENDING',
            mine: Boolean(studentId && comment.studentId === studentId),
          })),
      }
    }),
    error: null,
    missingTable: false,
  }
}

export async function loadTeacherEnglishOutside(): Promise<{
  resources: TeacherResource[]
  suggestions: TeacherSuggestion[]
  pendingComments: TeacherPendingComment[]
  error: string | null
  missingTable: boolean
}> {
  const { rows: resources, error, missingTable } = await listResourceRows()
  if (error) {
    return {
      resources: [],
      suggestions: [],
      pendingComments: [],
      error: missingTable ? null : 'The list could not be loaded.',
      missingTable: Boolean(missingTable),
    }
  }

  const ids = resources.map((resource) => resource.id)
  const { rows: ratings, error: ratingError } = await listRatingRows(ids)
  if (ratingError) {
    return {
      resources: [],
      suggestions: [],
      pendingComments: [],
      error: 'The list could not be loaded.',
      missingTable: false,
    }
  }

  const { rows: comments, error: commentError } = await listCommentRows({
    statuses: ['APPROVED', 'PENDING'],
  })
  if (commentError) {
    return {
      resources: [],
      suggestions: [],
      pendingComments: [],
      error: 'Comments could not be loaded.',
      missingTable: false,
    }
  }

  const { rows: suggestionData, error: suggestionError } = await listSuggestionRows('PENDING')
  if (suggestionError) {
    return {
      resources: [],
      suggestions: [],
      pendingComments: [],
      error: 'Suggestions could not be loaded.',
      missingTable: false,
    }
  }

  const titleById = new Map(resources.map((resource) => [resource.id, resource.title]))

  return {
    resources: resources.map((resource) => {
      const resourceRatings = ratings.filter((rating) => rating.resourceId === resource.id)
      return {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        format: resource.format,
        whereToFind: resource.whereToFind,
        level: resource.level,
        topicTags: resource.topicTags || [],
        contentNotes: resource.contentNotes || [],
        suggestedByName: resource.suggestedByName,
        status: resource.status,
        createdAt: resource.createdAt,
        averageRating: average(resourceRatings.map((rating) => rating.stars)),
        ratingCount: resourceRatings.length,
        approvedComments: comments
          .filter((comment) => comment.resourceId === resource.id && comment.status === 'APPROVED')
          .map((comment) => ({
            id: comment.id,
            studentName: comment.studentName,
            body: comment.body,
          })),
      }
    }),
    suggestions: suggestionData.map((suggestion) => ({
      id: suggestion.id,
      studentName: suggestion.studentName,
      title: suggestion.title,
      url: suggestion.url,
      format: suggestion.format,
      whereToFind: suggestion.whereToFind,
      whyRecommend: suggestion.whyRecommend,
      studentContentNote: suggestion.studentContentNote,
      createdAt: suggestion.createdAt,
    })),
    pendingComments: comments
      .filter((comment) => comment.status === 'PENDING')
      .map((comment) => ({
        id: comment.id,
        resourceId: comment.resourceId,
        resourceTitle: titleById.get(comment.resourceId) || 'Removed title',
        studentName: comment.studentName,
        body: comment.body,
        createdAt: comment.createdAt,
      })),
    error: null,
    missingTable: false,
  }
}
