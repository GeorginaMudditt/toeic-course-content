import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import TeacherStudentsTable from '@/components/TeacherStudentsTable'

export default async function StudentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  let students: { id: string; name: string; email: string; studentLifecycleStatus: string | null }[] =
    []

  try {
    const { data: studentData, error: studentError } = await supabaseServer
      .from('User')
      .select('id, name, email, studentLifecycleStatus')
      .eq('role', 'STUDENT')
      .order('lastSeenAt', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })

    if (studentError) {
      console.error('Error loading students:', studentError)
    } else if (studentData) {
      students = studentData
    }
  } catch (error) {
    console.error('Error loading students:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
            <Link
              href="/teacher/students/new"
              className="text-white px-4 py-2 rounded-md transition-colors hover:bg-[#2d3569]"
              style={{ backgroundColor: '#38438f' }}
            >
              + Add Student
            </Link>
          </div>

          <TeacherStudentsTable students={students} />

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Progress</h2>
            <div className="bg-white shadow rounded-lg p-6">
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
    </div>
  )
}
