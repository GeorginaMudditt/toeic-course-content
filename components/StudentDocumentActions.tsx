'use client'

interface Props {
  fileUrl: string
  fileName: string
}

export default function StudentDocumentActions({ fileUrl, fileName }: Props) {
  return (
    <div className="flex items-center ml-4">
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        View
      </a>
    </div>
  )
}
