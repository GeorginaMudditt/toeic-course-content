import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import QualiopiSpreadsheetEmbed from '@/components/QualiopiSpreadsheetEmbed'
import {
  getQualiopiDocument,
  isQualiopiHub,
} from '@/lib/qualiopi-documents'

export default async function QualiopiDocumentPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const document = getQualiopiDocument(params.slug)
  if (!document) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isQualiopiHub(document) ? (
            <>
              <div className="mb-4">
                <Link
                  href="/teacher/qualiopi"
                  className="text-sm transition-colors hover:text-[#2d3569]"
                  style={{ color: '#38438f' }}
                >
                  ← Back to Qualiopi
                </Link>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{document.title}</h1>
              <p className="text-gray-600 mb-8">{document.description}</p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {document.folders?.map((folder) => (
                  <Link
                    key={folder.slug}
                    href={`/teacher/qualiopi/${document.slug}/${folder.slug}`}
                    className="bg-blue-50 hover:bg-blue-100 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ color: '#38438f' }}>
                      {folder.title}
                    </h2>
                    <p className="text-gray-600 text-sm">{folder.description}</p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <QualiopiSpreadsheetEmbed
              title={document.title}
              description={document.description}
              spreadsheetId={document.spreadsheetId}
              backHref="/teacher/qualiopi"
              backLabel="← Back to Qualiopi"
            />
          )}
        </div>
      </div>
    </div>
  )
}
