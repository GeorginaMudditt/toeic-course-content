import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { FRENCH_XAVIER_RESOURCES } from '@/lib/french-content'

export default async function FrenchXavierResourcesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/teacher/french"
            className="mb-4 inline-block text-sm font-medium text-[#38438f] hover:underline"
          >
            ← Back to French
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Xavier resources</h1>
          <p className="mb-8 text-sm text-gray-600">
            PDFs from your Adomlingua work with Xavier. Open any file to revise or print.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FRENCH_XAVIER_RESOURCES.map((resource) => (
              <a
                key={resource.href}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm transition-colors hover:border-amber-300"
              >
                <h2 className="text-lg font-semibold text-amber-950">{resource.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
                <p className="mt-3 text-sm font-medium text-[#38438f]">Open PDF →</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
