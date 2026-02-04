import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatUKDate, formatCourseName } from '@/lib/date-utils'
import AssignmentsList from './AssignmentsList'

// Disable static caching to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MyCoursePage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  // Use Supabase REST API instead of Prisma for serverless compatibility
  let enrollments: any[] = []

  try {
    // Fetch enrollments for this student
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('studentId', session.user.id)

    if (enrollmentError) {
      console.error('Error loading enrollments:', enrollmentError)
    } else if (enrollmentData && enrollmentData.length > 0) {
      // Fetch courses for these enrollments
      const courseIds = enrollmentData.map(e => e.courseId)
      const { data: courseData, error: courseError } = await supabaseServer
        .from('Course')
        .select('*')
        .in('id', courseIds)

      if (courseError) {
        console.error('Error loading courses:', courseError)
      } else {
        // Fetch assignments for these enrollments
        const enrollmentIds = enrollmentData.map(e => e.id)
        const { data: assignmentData, error: assignmentError } = await supabaseServer
          .from('Assignment')
          .select('*')
          .in('enrollmentId', enrollmentIds)
          .order('order', { ascending: true })

        if (assignmentError) {
          console.error('Error loading assignments:', assignmentError)
        } else {
          // Fetch resources for these assignments
          const resourceIds = (assignmentData || []).map((a: any) => a.resourceId)
          let resourceData: any[] = []
          if (resourceIds.length > 0) {
            const { data: resourcesData, error: resourcesError } = await supabaseServer
              .from('Resource')
              .select('*')
              .in('id', resourceIds)

            if (resourcesError) {
              console.error('Error loading resources:', resourcesError)
            } else {
              resourceData = resourcesData || []
            }
          }

          // Fetch progress for these assignments
          const assignmentIds = (assignmentData || []).map((a: any) => a.id)
          let progressData: any[] = []
          if (assignmentIds.length > 0) {
            const { data: progressDataResult, error: progressError } = await supabaseServer
              .from('Progress')
              .select('*')
              .in('assignmentId', assignmentIds)
              .eq('studentId', session.user.id)

            if (progressError) {
              console.error('Error loading progress:', progressError)
            } else {
              progressData = progressDataResult || []
            }
          }

          // Combine the data to match the expected structure
          enrollments = enrollmentData.map(enrollment => ({
            ...enrollment,
            enrolledAt: new Date(enrollment.enrolledAt),
            course: (courseData || []).find(c => c.id === enrollment.courseId) || null,
            assignments: (assignmentData || [])
              .filter((a: any) => a.enrollmentId === enrollment.id)
              .map((assignment: any) => ({
                ...assignment,
                resource: resourceData.find(r => r.id === assignment.resourceId) || null,
                progress: progressData.filter((p: any) => p.assignmentId === assignment.id)
              }))
          }))
        }
      }
    }
  } catch (error) {
    console.error('Error loading course data:', error)
    // Continue with empty array so the page still renders
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Course</h1>

          {enrollments.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500">You haven't been enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {enrollment.course ? (
                        <>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {formatCourseName(enrollment.course.name, enrollment.course.duration)}
                          </h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Enrolled {formatUKDate(enrollment.enrolledAt)}
                          </p>
                          {enrollment.course.description && (
                            <p className="text-sm text-gray-600 mt-2">{enrollment.course.description}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <h2 className="text-xl font-semibold text-gray-900">Course Information Unavailable</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Enrolled {formatUKDate(enrollment.enrolledAt)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <AssignmentsList assignments={enrollment.assignments} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

