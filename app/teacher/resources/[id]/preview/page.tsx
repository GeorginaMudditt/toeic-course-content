import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import ResourcePreview from '@/components/ResourcePreview'
import Link from 'next/link'

export default async function ResourcePreviewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const resource = await prisma.resource.findUnique({
    where: { id: params.id }
  })

  if (!resource) {
    redirect('/teacher/resources')
  }

  // Verify the resource belongs to the logged-in teacher
  if (resource.creatorId !== session.user.id) {
    redirect('/teacher/resources')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{resource.title}</h1>
              {resource.description && (
                <p className="text-gray-600 mt-2">{resource.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/teacher/resources/${resource.id}`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Edit
              </Link>
              <Link
                href="/teacher/resources"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Resources
              </Link>
            </div>
          </div>

          <ResourcePreview resource={resource} />
        </div>
      </div>
    </div>
  )
}

