import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import FrenchXavierResourcesManager from '@/components/FrenchXavierResourcesManager'

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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Xavier resources</h1>
          <FrenchXavierResourcesManager />
        </div>
      </div>
    </div>
  )
}
