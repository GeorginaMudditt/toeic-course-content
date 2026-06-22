import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TeacherPinboard from '@/components/TeacherPinboard'
import { getFamilyPhotos } from '@/lib/family-photos'

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  const photos = getFamilyPhotos()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TeacherPinboard photos={photos} />
    </div>
  )
}
