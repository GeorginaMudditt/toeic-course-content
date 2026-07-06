import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { BPF_PERIODS } from '@/lib/bpf'

export default async function NdaCoveredActivityPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NDA-covered activity</h1>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Choose the accounting period for your BPF (Bilan Pédagogique et Financier). Record
            training actions delivered within that period so you can filter NDA-covered activity
            when lodging the declaration each May.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {BPF_PERIODS.map((period) => (
              <Link
                key={period.slug}
                href={`/teacher/admin/nda-covered-activity/${period.slug}`}
                className="group rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <h2 className="text-xl font-semibold text-emerald-900 group-hover:text-[#38438f]">
                  {period.label}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Open the entry form for training actions in this exercice comptable.
                </p>
                <span className="mt-4 inline-flex text-sm font-semibold text-[#38438f] group-hover:underline">
                  View entries →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
