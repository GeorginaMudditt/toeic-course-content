import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StudentFolders from '@/components/StudentFolders'
import {
  isInDashboardArchive,
  isVisibleOnDashboard,
  loadDashboardStudentRows,
} from '@/lib/dashboard-student-folders'

export default async function TeacherOnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const studentData = await loadDashboardStudentRows()

  const students = studentData
    .filter((student) => isVisibleOnDashboard(student))
    .map(({ id, name }) => ({ id, name }))

  const archivedCount = studentData.filter((student) => isInDashboardArchive(student)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Onboarding</h1>
          <StudentFolders students={students} archivedCount={archivedCount} />
        </div>
      </div>
    </div>
  )
}
