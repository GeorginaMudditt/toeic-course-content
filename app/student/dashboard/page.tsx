import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatUKDate, formatCourseName } from '@/lib/date-utils'

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  // Use Supabase REST API instead of Prisma for serverless compatibility
  let enrollments: any[] = []

  try {
    // First get enrollments
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('studentId', session.user.id)

    if (enrollmentError) {
      console.error('Error loading enrollments:', enrollmentError)
    } else if (enrollmentData && enrollmentData.length > 0) {
      // Then get courses for each enrollment
      const courseIds = enrollmentData.map(e => e.courseId)
      const { data: courseData, error: courseError } = await supabaseServer
        .from('Course')
        .select('*')
        .in('id', courseIds)

      if (courseError) {
        console.error('Error loading courses:', courseError)
      } else {
        // Combine enrollments with courses
        enrollments = enrollmentData.map(enrollment => ({
          ...enrollment,
          course: courseData?.find(c => c.id === enrollment.courseId) || null
        }))
      }
    }
  } catch (error) {
    console.error('Error loading enrollments:', error)
    // Continue with empty array so the page still renders
  }

  // Get the first enrollment for the "My Course" card
  const firstEnrollment = enrollments[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* About the TOEIC® 4-Skills Test Card */}
            <Link
              href="/student/toeic-info"
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ color: '#38438f' }}>
                About the TOEIC® 4-Skills Test
              </h2>
              <p className="text-gray-600 text-sm">
                Find out about test duration, format and scoring
              </p>
            </Link>

            {/* Vocabulary by CEFR level Card */}
            <Link
              href="/student/vocabulary"
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ color: '#38438f' }}>
                Vocabulary by CEFR level
              </h2>
              <p className="text-gray-600 text-sm">
                Test your vocabulary knowledge with these fun activities
              </p>
            </Link>

            {/* My Course Card */}
            <Link
              href="/student/course"
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ color: '#38438f' }}>
                My Course
              </h2>
              {firstEnrollment ? (
                <p className="text-gray-600 text-sm">
                  {formatCourseName(firstEnrollment.course.name, firstEnrollment.course.duration)} - enrolled {formatUKDate(firstEnrollment.enrolledAt)}
                </p>
              ) : (
                <p className="text-gray-600 text-sm">
                  No course enrolled yet
                </p>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

