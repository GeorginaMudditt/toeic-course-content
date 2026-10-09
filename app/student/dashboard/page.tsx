import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { getSavedSectionsForDashboard } from '@/lib/resource-bookmarks'
import SavedSectionsPanel from '@/components/SavedSectionsPanel'
import { formatUKDate, formatCourseName } from '@/lib/date-utils'
import { loadCourseHourPanels } from '@/lib/student-course-hours'
import { loadUpcomingLessonsForStudent } from '@/lib/booked-lessons'
import CourseHoursProgress from '@/components/CourseHoursProgress'
import UpcomingLessons from '@/components/UpcomingLessons'
import DashboardCardStyleSamples from '@/components/DashboardCardStyleSamples'

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
        // Combine enrollments with courses and convert date strings to Date objects
        enrollments = enrollmentData.map(enrollment => ({
          ...enrollment,
          enrolledAt: new Date(enrollment.enrolledAt),
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

  // Fetch document count for the "My Docs" card
  let documentCount = 0
  try {
    const { data: documentsData, error: documentsError } = await supabaseServer
      .from('StudentDocument')
      .select('id')
      .eq('studentId', session.user.id)

    if (!documentsError && documentsData) {
      documentCount = documentsData.length || 0
    }
  } catch (error) {
    console.error('Error loading document count:', error)
  }

  const savedSections = await getSavedSectionsForDashboard(session.user.id)
  const courseHourPanels = await loadCourseHourPanels(session.user.id)
  const upcomingLessons = await loadUpcomingLessonsForStudent(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
            hrefFor={(path) => path}
          />

          <SavedSectionsPanel sections={savedSections} />
        </div>
      </div>
    </div>
  )
}

