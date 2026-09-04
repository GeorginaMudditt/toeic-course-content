import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import WhatsNextTaskBoard from '@/components/WhatsNextTaskBoard'
import SocialMediaPlanner from '@/components/SocialMediaPlanner'

export default async function WhatsNextPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What&apos;s Next?</h1>
          <p className="mb-8 text-sm text-gray-600">
            Plan your tasks on the left and your social media schedule on the right. Drag to
            reorder, tick items off when they&apos;re done.
          </p>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <section className="min-w-0">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">To do</h2>
              <WhatsNextTaskBoard />
            </section>

            <section className="min-w-0">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Social media</h2>
              <SocialMediaPlanner />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
