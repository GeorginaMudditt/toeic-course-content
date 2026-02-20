import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatCourseName } from '@/lib/date-utils'
import StudentNotesView from '@/components/StudentNotesView'

export default async function StudentNotesPage({ searchParams }: { searchParams: { viewAs?: string } }) {
  const session = await getServerSession(authOptions)
  const viewAs = searchParams?.viewAs
  
  // Allow teachers to view if they have viewAs parameter
  if (viewAs && session?.user.role === 'TEACHER') {
    // Teacher viewing as student - allow access
  } else if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  const studentId = viewAs && session?.user.role === 'TEACHER' ? viewAs : session.user.id

  let enrollments: any[] = []

  try {
    // Fetch enrollments for this student
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('studentId', studentId)

    if (!enrollmentError && enrollmentData && enrollmentData.length > 0) {
      // Fetch courses for these enrollments
      const courseIds = enrollmentData.map(e => e.courseId)
      const { data: courseData, error: courseError } = await supabaseServer
        .from('Course')
        .select('*')
        .in('id', courseIds)

      if (!courseError && courseData) {
        // Fetch notes for these enrollments
        const enrollmentIds = enrollmentData.map(e => e.id)
        const { data: notesData, error: notesError } = await supabaseServer
          .from('CourseNote')
          .select('*')
          .in('enrollmentId', enrollmentIds)

        // Combine enrollments with courses and notes
        enrollments = enrollmentData.map(enrollment => ({
          ...enrollment,
          enrolledAt: new Date(enrollment.enrolledAt),
          course: courseData.find(c => c.id === enrollment.courseId) || null,
          note: notesData?.find(n => n.enrollmentId === enrollment.id) || null
        }))
      }
    }
  } catch (error) {
    console.error('Error loading notes:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href={viewAs ? `/teacher/students/${viewAs}/view` : '/student/dashboard'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Notes</h1>

          {enrollments.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">You haven't been enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {enrollment.course 
                      ? formatCourseName(enrollment.course.name, enrollment.course.duration)
                      : 'Unknown Course'}
                  </h2>
                  
                  {enrollment.note ? (
                    <StudentNotesView content={enrollment.note.content} />
                  ) : (
                    <div className="text-gray-500 italic py-8 text-center">
                      No notes yet. Your teacher will add notes here during your lessons.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
