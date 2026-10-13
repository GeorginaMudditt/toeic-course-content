import Link from 'next/link'
import QualiopiProfessionalUpdates from '@/components/QualiopiProfessionalUpdates'
import {
  getGoogleSheetEditUrl,
  getGoogleSheetEmbedUrl,
  type QualiopiResourceLink,
} from '@/lib/qualiopi-documents'

export default function QualiopiSpreadsheetEmbed({
  title,
  description,
  spreadsheetId,
  backHref,
  backLabel,
  resourceLinksIntro,
  resourceLinks,
}: {
  title: string
  description: string
  spreadsheetId: string
  backHref: string
  backLabel: string
  resourceLinksIntro?: string
  resourceLinks?: QualiopiResourceLink[]
}) {
  const embedUrl = getGoogleSheetEmbedUrl(spreadsheetId)
  const editUrl = getGoogleSheetEditUrl(spreadsheetId)

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
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
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

      {resourceLinks && resourceLinks.length > 0 && (
        <div className="mb-6">
          <QualiopiProfessionalUpdates intro={resourceLinksIntro} links={resourceLinks} />
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full border-0"
          style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </>
  )
}
