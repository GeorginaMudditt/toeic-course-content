import Link from 'next/link'
import {
  getGoogleSheetEditUrl,
  getGoogleSheetEmbedUrl,
  type QualiopiDocument,
} from '@/lib/qualiopi-documents'

export default function QualiopiSpreadsheetEmbed({
  document,
  backHref,
  backLabel,
}: {
  document: QualiopiDocument
  backHref: string
  backLabel: string
}) {
  const embedUrl = getGoogleSheetEmbedUrl(document.spreadsheetId)
  const editUrl = getGoogleSheetEditUrl(document.spreadsheetId)

  return (
    <>
      <div className="mb-4">
        <Link
          href={backHref}
          className="text-sm transition-colors hover:text-[#2d3569]"
          style={{ color: '#38438f' }}
        >
          {backLabel}
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
          <p className="text-gray-600 mt-1">{document.description}</p>
        </div>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md transition-colors hover:bg-[#2d3569] shrink-0"
          style={{ backgroundColor: '#38438f' }}
        >
          Open in Google Sheets
        </a>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={document.title}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </>
  )
}
