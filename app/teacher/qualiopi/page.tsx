import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import {
  getQualiopiDocumentsByCategory,
  type QualiopiDocument,
} from '@/lib/qualiopi-documents'

function QualiopiCard({
  document,
  cardClassName,
}: {
  document: QualiopiDocument
  cardClassName: string
}) {
  return (
    <Link
      href={`/teacher/qualiopi/${document.slug}`}
      className={`shadow rounded-lg p-6 hover:shadow-lg transition-shadow ${cardClassName}`}
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ color: '#38438f' }}>
        {document.title}
      </h2>
      <p className="text-gray-600 text-sm">{document.description}</p>
    </Link>
  )
}

export default async function QualiopiPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const keyDocuments = getQualiopiDocumentsByCategory('key')
  const indicatorDocuments = getQualiopiDocumentsByCategory('indicator')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Qualiopi</h1>
          <p className="text-gray-600 mb-8">
            Keep your Qualiopi documentation organised in one place.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Qualiopi Documents</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {keyDocuments.map((document) => (
                <QualiopiCard
                  key={document.slug}
                  document={document}
                  cardClassName="bg-pink-50 hover:bg-pink-100"
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Qualiopi indicators</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {indicatorDocuments.map((document) => (
                <QualiopiCard
                  key={document.slug}
                  document={document}
                  cardClassName="bg-blue-50 hover:bg-blue-100"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
