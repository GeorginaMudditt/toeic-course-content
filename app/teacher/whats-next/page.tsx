import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import WhatsNextTaskBoard from '@/components/WhatsNextTaskBoard'

export default async function WhatsNextPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What&apos;s Next?</h1>
          <p className="mb-8 text-sm text-gray-600">
            Drag open tasks to set your priorities. Tick them off when they&apos;re done.
          </p>
          <WhatsNextTaskBoard />
        </div>
      </div>
    </div>
  )
}
