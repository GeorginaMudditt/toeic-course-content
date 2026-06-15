import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import StudentFolders from '@/components/StudentFolders'
import {
  isInDashboardArchive,
  isVisibleOnDashboard,
  loadDashboardStudentRows,
} from '@/lib/dashboard-student-folders'

export default async function TeacherDashboard() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Teacher Dashboard</h1>

          <StudentFolders students={students} archivedCount={archivedCount} />

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
              <Link
                href="/teacher/progress"
                className="block p-4 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-[#38438f] hover:bg-[#e8eaf6]"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium text-gray-900">View Progress</div>
                </div>
              </Link>
              <Link
                href="/teacher/vocabulary-progress"
                className="block p-4 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-[#38438f] hover:bg-[#e8eaf6]"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-medium text-gray-900">Vocabulary Progress</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
