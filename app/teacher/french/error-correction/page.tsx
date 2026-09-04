import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import FrenchErrorCorrectionTable from '@/components/FrenchErrorCorrectionTable'

export default async function FrenchErrorCorrectionPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Error correction</h1>
          <p className="mb-2 text-sm text-gray-600">
            Mistakes and corrections you can add to over time. Seeded from your Talkpal notes.
          </p>
          <p className="mb-8 text-sm text-gray-500">
            <a
              href="/french/French_Corrections.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38438f] hover:underline"
            >
              Open original PDF
            </a>
          </p>
          <FrenchErrorCorrectionTable />
        </div>
      </div>
    </div>
  )
}
