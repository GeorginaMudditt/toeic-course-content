import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import StudentAssignmentManager from '@/components/StudentAssignmentManager'
import Link from 'next/link'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const student = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      enrollments: {
        include: {
          course: true,
          assignments: {
            include: {
              resource: true,
              progress: true
            },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })

  if (!student || student.role !== 'STUDENT') {
    redirect('/teacher/students')
  }

  const allResources = await prisma.resource.findMany({
    where: { creatorId: session.user.id },
    orderBy: { title: 'asc' }
  })

  const courses = await prisma.course.findMany({
    where: { creatorId: session.user.id },
    orderBy: { name: 'asc' }
  })

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

