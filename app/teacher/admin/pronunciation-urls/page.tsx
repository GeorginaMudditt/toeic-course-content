import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MarketingPronunciationManager from '@/components/MarketingPronunciationManager'

export default async function MarketingPronunciationPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/teacher/admin"
              className="text-sm font-medium text-[#38438f] hover:underline"
            >
              ← Back to Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate Brizzle Pronunciation URLs
          </h1>
          <p className="text-gray-600 mb-8">
            Create short Brizzle links for Facebook Word of the Day audio clips.
          </p>
          <MarketingPronunciationManager />
        </div>
      </div>
    </div>
  )
}
