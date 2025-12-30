import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { LEVEL_INFO } from '@/lib/level-colors'

export default async function VocabularyPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vocabulary by CEFR Level</h1>
          <p className="text-gray-600 mb-8">
            Select the level that best matches your current English skills
          </p>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LEVEL_INFO.map((level) => {
                const isA1 = level.id === 'A1'
                const LevelCard = isA1 ? Link : 'div'
                const cardProps = isA1 
                  ? { href: `/student/vocabulary/${level.id.toLowerCase()}` }
                  : {}
                
                return (
                  <LevelCard
                    key={level.id}
                    {...cardProps}
                    className={`border-2 rounded-lg p-6 transition-all ${
                      isA1 
                        ? 'hover:shadow-lg cursor-pointer' 
                        : 'cursor-not-allowed opacity-60 relative group'
                    }`}
                    style={{ borderColor: level.color }}
                    title={!isA1 ? 'This level is coming soon' : undefined}
                  >
                    {!isA1 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="text-sm font-medium text-gray-700">This level is coming soon</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold" style={{ color: level.color }}>
                          {level.id}:
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mt-1">
                          {level.name}
                        </h3>
                      </div>
                      {isA1 && (
                        <div className="text-2xl" style={{ color: level.color }}>
                          →
                        </div>
                      )}
                    </div>
                  </LevelCard>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

