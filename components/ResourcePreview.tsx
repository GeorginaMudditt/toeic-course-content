'use client'

import WorksheetViewer from '@/components/WorksheetViewer'

interface Resource {
  id: string
  title: string
  content: string
  type: string
  description?: string | null
  level?: string | null
  createdAt?: string
  updatedAt?: string
}

interface ResourcePreviewProps {
  resource: Resource
  showActions?: boolean
}

/** Teacher-facing preview — renders the same student worksheet UI via WorksheetViewer. */
export default function ResourcePreview({ resource, showActions = true }: ResourcePreviewProps) {
  return (
    <WorksheetViewer
      assignmentId="preview"
      resource={resource}
      initialProgress={null}
      preventSave
      compact={!showActions}
      backHref="/teacher/resources"
      backLabel="Back to Resources"
      showStudentNotice={false}
    />
  )
}
