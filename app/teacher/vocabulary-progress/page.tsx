import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import VocabularyProgressList from '@/components/VocabularyProgressList'
import { loadVocabularyProgressStudentRows } from '@/lib/vocabulary-progress-students'

export default async function VocabularyProgressPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  let vocabularyProgress: any[] = []

  try {
    const students = await loadVocabularyProgressStudentRows()

    if (students.length > 0) {
      const studentIds = students.map((student) => student.id)
      const { data: progressData, error: progressError } = await supabaseServer
        .from('VocabularyProgress')
        .select('*')
        .in('studentId', studentIds)
        .order('updatedAt', { ascending: false })

      if (progressError) {
        console.error('Error loading vocabulary progress:', progressError)
      } else {
        vocabularyProgress = progressData || []
      }
    }

    const progressByStudent = students.map((student) => {
      const studentProgress = vocabularyProgress.filter((progress) => progress.studentId === student.id)
      const byLevel: Record<string, any[]> = {}

      studentProgress.forEach((progress) => {
        if (!byLevel[progress.level]) {
          byLevel[progress.level] = []
        }
        byLevel[progress.level].push(progress)
      })

      const totalTopics = studentProgress.length
      const completedTopics = studentProgress.filter(
        (progress) => progress.bronze && progress.silver && progress.gold
      ).length
      const totalChallenges = totalTopics * 3
      const completedChallenges = studentProgress.reduce((sum, progress) => {
        return sum + (progress.bronze ? 1 : 0) + (progress.silver ? 1 : 0) + (progress.gold ? 1 : 0)
      }, 0)

      return {
        ...student,
        byLevel,
        totalTopics,
        completedTopics,
        totalChallenges,
        completedChallenges,
      }
    })

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Vocabulary Challenge Progress</h1>
              <Link
                href="/teacher/students"
                className="text-sm font-medium transition-colors hover:text-[#2d3569]"
                style={{ color: '#38438f' }}
              >
                ← Back to Manage Students
              </Link>
            </div>

            <VocabularyProgressList students={progressByStudent} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading vocabulary progress page:', error)

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Vocabulary Challenge Progress</h1>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">Unable to load vocabulary progress right now.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
