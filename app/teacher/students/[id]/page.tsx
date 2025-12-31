import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import StudentAssignmentManager from '@/components/StudentAssignmentManager'
import Link from 'next/link'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  let student: any = null
  let allResources: any[] = []
  let courses: any[] = []

  try {
    // Fetch the student
    const { data: studentData, error: studentError } = await supabaseServer
      .from('User')
      .select('*')
      .eq('id', params.id)
      .eq('role', 'STUDENT')
      .limit(1)

    if (studentError) {
      console.error('Error fetching student:', studentError)
      redirect('/teacher/students')
    }

    if (!studentData || studentData.length === 0) {
      redirect('/teacher/students')
    }

    const studentRecord = studentData[0]

    // Fetch enrollments for this student
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('studentId', params.id)

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
    }

    // Fetch courses for these enrollments
    const courseIds = enrollmentData?.map(e => e.courseId) || []
    let courseData: any[] = []
    if (courseIds.length > 0) {
      const { data: coursesData, error: coursesError } = await supabaseServer
        .from('Course')
        .select('*')
        .in('id', courseIds)
      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
      } else {
        courseData = coursesData || []
      }
    }

    // Fetch assignments for these enrollments
    const enrollmentIds = enrollmentData?.map(e => e.id) || []
    let assignmentData: any[] = []
    if (enrollmentIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabaseServer
        .from('Assignment')
        .select('*')
        .in('enrollmentId', enrollmentIds)
        .order('order', { ascending: true })
      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
      } else {
        assignmentData = assignmentsData || []
      }
    }

    // Fetch resources for these assignments
    const resourceIds = assignmentData.map(a => a.resourceId)
    let resourceData: any[] = []
    if (resourceIds.length > 0) {
      const { data: resourcesData, error: resourcesError } = await supabaseServer
        .from('Resource')
        .select('*')
        .in('id', resourceIds)
      if (resourcesError) {
        console.error('Error fetching resources:', resourcesError)
      } else {
        resourceData = resourcesData || []
      }
    }

    // Fetch progress for these assignments
    const assignmentIds = assignmentData.map(a => a.id)
    let progressData: any[] = []
    if (assignmentIds.length > 0) {
      const { data: progressDataResult, error: progressError } = await supabaseServer
        .from('Progress')
        .select('*')
        .in('assignmentId', assignmentIds)
      if (progressError) {
        console.error('Error fetching progress:', progressError)
      } else {
        progressData = progressDataResult || []
      }
    }

    // Combine the data to match the expected structure
    const enrollments = (enrollmentData || []).map(enrollment => ({
      ...enrollment,
      enrolledAt: new Date(enrollment.enrolledAt),
      course: courseData.find(c => c.id === enrollment.courseId) || null,
      assignments: assignmentData
        .filter(a => a.enrollmentId === enrollment.id)
        .map(assignment => ({
          ...assignment,
          resource: resourceData.find(r => r.id === assignment.resourceId) || null,
          progress: progressData.filter(p => p.assignmentId === assignment.id)
        }))
    }))

    student = {
      ...studentRecord,
      enrollments
    }

    // Fetch all resources for the teacher
    const { data: resourcesList, error: resourcesListError } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('creatorId', session.user.id)
      .order('title', { ascending: true })

    if (resourcesListError) {
      console.error('Error fetching all resources:', resourcesListError)
    } else {
      allResources = resourcesList || []
    }

    // Fetch all courses for the teacher
    const { data: coursesList, error: coursesListError } = await supabaseServer
      .from('Course')
      .select('*')
      .eq('creatorId', session.user.id)
      .order('name', { ascending: true })

    if (coursesListError) {
      console.error('Error fetching all courses:', coursesListError)
    } else {
      courses = coursesList || []
    }
  } catch (error) {
    console.error('Error loading student detail page:', error)
    redirect('/teacher/students')
  }

  if (!student) {
    redirect('/teacher/students')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/teacher/students"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to list of students
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600">{student.email}</p>
          </div>

          <StudentAssignmentManager
            student={student}
            resources={allResources}
            courses={courses}
          />
        </div>
      </div>
    </div>
  )
}

