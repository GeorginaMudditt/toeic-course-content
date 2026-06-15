import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import StudentFolders from '@/components/StudentFolders'
import {
  canUnarchiveDashboardFolder,
  isInDashboardArchive,
  loadDashboardStudentRows,
} from '@/lib/dashboard-student-folders'

export default async function ArchivedStudentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const studentData = await loadDashboardStudentRows()

  const students = studentData
    .filter((student) => isInDashboardArchive(student))
    .map((student) => ({
      id: student.id,
      name: student.name,
      canUnarchive: canUnarchiveDashboardFolder(student),
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/teacher/dashboard"
              className="text-sm font-medium text-[#38438f] hover:text-[#2d3569]"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Archive</h1>
            <p className="mt-1 text-sm text-gray-600">
              Folders hidden from the dashboard. Student status in the Students tab is unchanged.
            </p>
          </div>

          <StudentFolders students={students} mode="archive" />
        </div>
      </div>
    </div>
  )
}
