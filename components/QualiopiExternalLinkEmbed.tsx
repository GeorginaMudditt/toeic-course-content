import Link from 'next/link'
import {
  getGoogleDriveFolderEmbedUrl,
  getGoogleDriveFolderId,
} from '@/lib/qualiopi-documents'

export default function QualiopiExternalLinkEmbed({
  title,
  description,
  externalUrl,
  openLabel = 'Open link',
  backHref,
  backLabel,
}: {
  title: string
  description: string
  externalUrl: string
  openLabel?: string
  backHref: string
  backLabel: string
}) {
  const folderId = getGoogleDriveFolderId(externalUrl)
  const embedUrl = folderId ? getGoogleDriveFolderEmbedUrl(folderId) : null

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
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md transition-colors hover:bg-[#2d3569] shrink-0"
          style={{ backgroundColor: '#38438f' }}
        >
          {openLabel}
        </a>
      </div>

      {embedUrl ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full border-0"
            style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600 shadow-sm">
          <p>Use the button above to open this resource in a new tab.</p>
        </div>
      )}
    </>
  )
}
