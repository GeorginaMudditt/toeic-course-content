import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { LEVEL_COLORS } from '@/lib/level-colors'

export default async function VocabularyProgressPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/login')
  }

  let students: any[] = []
  let vocabularyProgress: any[] = []

  try {
    // Fetch all students
    const { data: studentData, error: studentError } = await supabaseServer
      .from('User')
      .select('id, name, email')
      .eq('role', 'STUDENT')
      .order('name', { ascending: true })

    if (studentError) {
      console.error('Error loading students:', studentError)
    } else {
      students = studentData || []
    }

    // Fetch all vocabulary progress
    if (students.length > 0) {
      const studentIds = students.map(s => s.id)
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
  } catch (error) {
    console.error('Error loading vocabulary progress page:', error)
  }

  // Group progress by student and level
  const progressByStudent = students.map(student => {
    const studentProgress = vocabularyProgress.filter(p => p.studentId === student.id)
    const byLevel: Record<string, any[]> = {}
    
    studentProgress.forEach(p => {
      if (!byLevel[p.level]) {
        byLevel[p.level] = []
      }
      byLevel[p.level].push(p)
    })

    // Calculate totals
    const totalTopics = studentProgress.length
    const completedTopics = studentProgress.filter(p => p.bronze && p.silver && p.gold).length
    const totalChallenges = totalTopics * 3
    const completedChallenges = studentProgress.reduce((sum, p) => {
      return sum + (p.bronze ? 1 : 0) + (p.silver ? 1 : 0) + (p.gold ? 1 : 0)
    }, 0)

    return {
      ...student,
      progress: studentProgress,
      byLevel,
      totalTopics,
      completedTopics,
      totalChallenges,
      completedChallenges
    }
  })

  const getLevelColor = (level: string) => {
    const levelMap: Record<string, string> = {
      'a1': LEVEL_COLORS.A1,
      'a2': LEVEL_COLORS.A2,
      'b1': LEVEL_COLORS.B1,
      'b2': LEVEL_COLORS.B2,
      'c1': LEVEL_COLORS.C1,
      'c2': LEVEL_COLORS.C2
    }
    return levelMap[level.toLowerCase()] || '#4A4A7D'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vocabulary Challenge Progress</h1>

          {students.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">No students found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {progressByStudent.map((student) => (
                <div key={student.id} className="bg-white shadow rounded-lg p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">{student.name}</h2>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-500">
                        {student.completedChallenges} / {student.totalChallenges} challenges completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: '#38438f', 
                          width: `${student.totalChallenges > 0 ? (student.completedChallenges / student.totalChallenges) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {student.completedTopics} / {student.totalTopics} topics fully completed
                    </div>
                  </div>

                  {Object.keys(student.byLevel).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(student.byLevel).map(([level, topics]) => (
                        <div key={level} className="border-t pt-4">
                          <h3 
                            className="font-medium mb-3"
                            style={{ color: getLevelColor(level) }}
                          >
                            Level {level.toUpperCase()}
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Challenge 1</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Challenge 2</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Challenge 3</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Completed</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {(topics as any[]).map((topicProgress: any) => {
                                  const allCompleted = topicProgress.bronze && topicProgress.silver && topicProgress.gold
                                  const completedCount = (topicProgress.bronze ? 1 : 0) + (topicProgress.silver ? 1 : 0) + (topicProgress.gold ? 1 : 0)
                                  const lastUpdated = topicProgress.updatedAt ? new Date(topicProgress.updatedAt).toLocaleDateString('en-GB') : '-'
                                  
                                  return (
                                    <tr key={topicProgress.id}>
                                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{topicProgress.topic}</td>
                                      <td className="px-4 py-2 text-center text-2xl">
                                        {topicProgress.bronze ? '🏅' : '○'}
                                      </td>
                                      <td className="px-4 py-2 text-center text-2xl">
                                        {topicProgress.silver ? '🏅' : '○'}
                                      </td>
                                      <td className="px-4 py-2 text-center text-2xl">
                                        {topicProgress.gold ? '🏅' : '○'}
                                      </td>
                                      <td className="px-4 py-2 text-center text-sm">
                                        {allCompleted ? (
                                          <span className="text-green-600 font-medium">✓ Complete</span>
                                        ) : (
                                          <span className="text-gray-500">{completedCount}/3</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">{lastUpdated}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No vocabulary progress yet.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
