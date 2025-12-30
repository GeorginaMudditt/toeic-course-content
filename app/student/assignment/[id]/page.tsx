import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import WorksheetViewer from '@/components/WorksheetViewer'

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.id },
    include: {
      resource: true,
      enrollment: {
        include: {
          student: true
        }
      },
      progress: {
        where: { studentId: session.user.id }
      }
    }
  })

  if (!assignment) {
    redirect('/student/dashboard')
  }

  // Verify the assignment belongs to the logged-in student
  if (assignment.enrollment.studentId !== session.user.id) {
    redirect('/student/dashboard')
  }

  const progress = assignment.progress[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{assignment.resource.title}</h1>
            {assignment.resource.description && (
              <p className="text-gray-600 mt-2">{assignment.resource.description}</p>
            )}
          </div>

          <WorksheetViewer
            assignmentId={assignment.id}
            resource={assignment.resource}
            initialProgress={progress}
          />
        </div>
      </div>
    </div>
  )
}

