import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import CentralContactList from '@/components/CentralContactList'

export default async function CentralContactListPage() {
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
            <Link href="/teacher/admin" className="text-sm font-medium text-[#38438f] hover:underline">
              ← Back to Admin
            </Link>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Central Contact List</h1>
          <p className="mb-8 text-gray-600">
            Students, parents, enquiries, and other contacts. Filter the list, then copy email
            addresses or download a spreadsheet of the rows you are looking at.
          </p>
          <CentralContactList />
        </div>
      </div>
    </div>
  )
}
