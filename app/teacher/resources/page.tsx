import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ResourcesList from './ResourcesList'

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  // Use Supabase REST API instead of Prisma for serverless compatibility
  let resources: any[] = []

  try {
    const { data, error } = await supabaseServer
      .from('Resource')
      .select('*')
      .eq('creatorId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading resources:', error)
    } else {
      resources = data || []
    }
  } catch (error) {
    console.error('Error loading resources:', error)
    // Continue with empty array so the page still renders
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ResourcesList resources={resources} />
        </div>
      </div>
    </div>
  )
}

