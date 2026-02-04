import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import WorksheetViewer from '@/components/WorksheetViewer'
import MarkAsViewed from './MarkAsViewed'

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  // Use Supabase REST API instead of Prisma for serverless compatibility
  let assignment: any = null
  let resource: any = null
  let progress: any = null

  try {
    // Fetch the assignment
    const { data: assignmentData, error: assignmentError } = await supabaseServer
      .from('Assignment')
      .select('*')
      .eq('id', params.id)
      .single()

    if (assignmentError || !assignmentData) {
      console.error('Error loading assignment:', assignmentError)
      redirect('/student/dashboard')
    }

    // Fetch the enrollment to verify ownership
    const { data: enrollmentData, error: enrollmentError } = await supabaseServer
      .from('Enrollment')
      .select('*')
      .eq('id', assignmentData.enrollmentId)
      .single()

    if (enrollmentError || !enrollmentData) {
      console.error('Error loading enrollment:', enrollmentError)
      redirect('/student/dashboard')
    }

    // Verify the assignment belongs to the logged-in student
    if (enrollmentData.studentId !== session.user.id) {
      redirect('/student/dashboard')
    }

    // Fetch the resource
    const { data: resourceData, error: resourceError } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('id', assignmentData.resourceId)
      .single()

    if (resourceError || !resourceData) {
      console.error('Error loading resource:', resourceError)
      redirect('/student/dashboard')
    }

    // Fetch progress for this assignment
    const { data: progressData, error: progressError } = await supabaseServer
      .from('Progress')
      .select('*')
      .eq('assignmentId', params.id)
      .eq('studentId', session.user.id)
      .limit(1)

    if (progressError) {
      console.error('Error loading progress:', progressError)
    }

    assignment = assignmentData
    resource = resourceData
    progress = progressData && progressData.length > 0 ? progressData[0] : null
  } catch (error) {
    console.error('Error loading assignment data:', error)
    redirect('/student/dashboard')
  }

  if (!assignment || !resource) {
    redirect('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{resource.title}</h1>
            {resource.description && (
              <p className="text-gray-600 mt-2">{resource.description}</p>
            )}
          </div>

          <MarkAsViewed assignmentId={assignment.id} hasProgress={!!progress} />
          <WorksheetViewer
            assignmentId={assignment.id}
            resource={resource}
            initialProgress={progress}
          />
        </div>
      </div>
    </div>
  )
}


