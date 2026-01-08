import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  // Use Supabase REST API instead of Prisma for serverless compatibility
  let resourceCount = 0
  let studentCount = 0
  let courseCount = 0
  let totalProgress = 0

  try {
    const [resourceResult, studentResult, courseResult, progressResult] = await Promise.all([
      supabaseServer
        .from('Resource')
        .select('*', { count: 'exact', head: true })
        .eq('creatorId', session.user.id),
      supabaseServer
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'STUDENT'),
      supabaseServer
        .from('Course')
        .select('*', { count: 'exact', head: true })
        .eq('creatorId', session.user.id),
      supabaseServer
        .from('Progress')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'COMPLETED')
    ])
    
    resourceCount = resourceResult.count || 0
    studentCount = studentResult.count || 0
    courseCount = courseResult.count || 0
    totalProgress = progressResult.count || 0
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // Continue with default values (0) so the page still renders
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Teacher Dashboard</h1>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Link href="/teacher/resources" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold" style={{ color: '#38438f' }}>{resourceCount}</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Resources
                      </dt>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/teacher/students" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{studentCount}</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Students
                      </dt>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold" style={{ color: '#2563eb' }}>{courseCount}</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Courses
                      </dt>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold" style={{ color: '#9333ea' }}>{totalProgress}</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/teacher/resources/new"
                className="block p-4 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-[#38438f] hover:bg-[#e8eaf6]"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-medium text-gray-900">Create New Resource</div>
                </div>
              </Link>
              <Link
                href="/teacher/students"
                className="block p-4 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-[#38438f] hover:bg-[#e8eaf6]"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-medium text-gray-900">Manage Students</div>
                </div>
              </Link>
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

