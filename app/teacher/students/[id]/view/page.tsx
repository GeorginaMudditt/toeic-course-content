import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatUKDate, formatCourseName } from '@/lib/date-utils'
import { loadCourseHourPanels } from '@/lib/student-course-hours'
import { loadUpcomingLessonsForStudent } from '@/lib/booked-lessons'
import CourseHoursProgress from '@/components/CourseHoursProgress'
import UpcomingLessons from '@/components/UpcomingLessons'
import DashboardCardStyleSamples from '@/components/DashboardCardStyleSamples'

export default async function StudentViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  let student: any = null
  let enrollments: any[] = []

  try {
    // Fetch the student
    const { data: studentData, error: studentError } = await supabaseServer
      .from('User')
      .select('*')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .limit(1)

    if (studentError || !studentData || studentData.length === 0) {
      redirect('/teacher/students')
    }

    const studentRecord = studentData[0]

    // Fetch enrollments for this student
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('studentId', params.id)

    if (!enrollmentError && enrollmentData && enrollmentData.length > 0) {
      // Fetch courses for these enrollments
      const courseIds = enrollmentData.map(e => e.courseId)
      const { data: courseData, error: courseError } = await supabaseServer
        .from('Course')
        .select('*')
        .in('id', courseIds)

      if (!courseError && courseData) {
        // Combine enrollments with courses
        enrollments = enrollmentData.map(enrollment => ({
          ...enrollment,
          enrolledAt: new Date(enrollment.enrolledAt),
          course: courseData.find(c => c.id === enrollment.courseId) || null
        }))
      }
    }

    student = studentRecord
  } catch (error) {
    console.error('Error loading student view:', error)
    redirect('/teacher/students')
  }

  // Get the first enrollment for the "My Course" card
  const firstEnrollment = enrollments[0]
  const courseHourPanels = await loadCourseHourPanels(params.id)
  const upcomingLessons = await loadUpcomingLessonsForStudent(params.id)

  // Fetch document count for the "My Docs" card
  let documentCount = 0
  try {
    const { data: documentsData, error: documentsError } = await supabaseServer
      .from('StudentDocument')
      .select('id')
      .eq('studentId', params.id)

    if (!documentsError && documentsData) {
      documentCount = documentsData.length || 0
    }
  } catch (error) {
    console.error('Error loading document count:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href={`/teacher/students/${params.id}`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Manage Student
            </Link>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Teacher View:</strong> You are viewing the student dashboard as it appears to <strong>{student.name}</strong>
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

          <div
            className={`mb-8 grid grid-cols-1 gap-6 ${
              courseHourPanels.length > 0 ? 'xl:grid-cols-2' : ''
            }`}
          >
            <CourseHoursProgress panels={courseHourPanels} />
            <UpcomingLessons lessons={upcomingLessons} />
          </div>

          <DashboardCardStyleSamples
            resourcesLine={
              firstEnrollment?.course
                ? `${formatCourseName(firstEnrollment.course.name, firstEnrollment.course.duration)} - enrolled ${formatUKDate(firstEnrollment.enrolledAt)}`
                : null
            }
            documentLine={
              documentCount > 0
                ? `${documentCount} document${documentCount !== 1 ? 's' : ''} available`
                : 'No documents assigned yet.'
            }
            hrefFor={(path) => `${path}?viewAs=${params.id}`}
          />
        </div>
      </div>
    </div>
  )
}
