import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BpfEntryManager from '@/components/BpfEntryManager'
import { getBpfPeriod } from '@/lib/bpf'

export default async function NdaCoveredActivityPeriodPage({
  params,
}: {
  params: { periodSlug: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const period = getBpfPeriod(params.periodSlug)
  if (!period) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            <Link href="/teacher/admin" className="font-medium text-[#38438f] hover:underline">
              ← Admin
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href="/teacher/admin/nda-covered-activity"
              className="font-medium text-[#38438f] hover:underline"
            >
              NDA-covered activity
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{period.label}</h1>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Log NDA-covered student training actions for this BPF period. Summary totals at the top
            roll up hours and revenue for cadres C, F, and G when you lodge the declaration in May.
            Use the dropdown hints to choose the right cadre F category for each trainee.
          </p>

          <BpfEntryManager period={period} />
        </div>
      </div>
    </div>
  )
}
