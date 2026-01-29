'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LEVEL_COLORS } from '@/lib/level-colors'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Topic {
  name: string
  count: number
}

// Vocabulary list PDF URLs by level
const VOCABULARY_LIST_PDFS: Record<string, string> = {
  'a1': 'https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/sign/vocab_lists/A1%20vocabulary%20list.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YzZhNjMzNi1iOWJkLTRlNDAtOTNmMS0wNmIzYWNkYmU3Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ2b2NhYl9saXN0cy9BMSB2b2NhYnVsYXJ5IGxpc3QucGRmIiwiaWF0IjoxNzY5NjY1Mjc5LCJleHAiOjIwODUwMjUyNzl9.krjVIZxJn0FE5qCiDdYB4mLvm73CqQrnHRKlWyyWzgA'
  // Add more levels here as they become available:
  // 'a2': 'https://...',
  // 'b1': 'https://...',
}

export default function VocabularyLevelPage() {
  const params = useParams()
  const router = useRouter()
  const level = (params.level as string)?.toLowerCase() || 'a1'

  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [topicToIcon, setTopicToIcon] = useState<Record<string, string>>({})
  const [topicProgress, setTopicProgress] = useState<Record<string, { bronze: boolean; silver: boolean; gold: boolean }>>({})

  // Fetch progress for all topics in this level
  const fetchProgress = useCallback(async () => {
    if (level !== 'a1') return
    
    try {
      const response = await fetch(`/api/vocabulary-progress?level=${level}`)
      const result = await response.json()
      
      if (response.ok && result.data) {
        const progressMap: Record<string, { bronze: boolean; silver: boolean; gold: boolean }> = {}
        result.data.forEach((item: any) => {
          // Normalize topic name: trim and remove extra spaces (matching vocabulary API normalization)
          const topicName = item.topic ? item.topic.trim().replace(/\s+/g, ' ') : item.topic
          // Explicitly convert to booleans - handle null, undefined, strings, etc.
          progressMap[topicName] = {
            bronze: item.bronze === true || item.bronze === 'true' || item.bronze === 1,
            silver: item.silver === true || item.silver === 'true' || item.silver === 1,
            gold: item.gold === true || item.gold === 'true' || item.gold === 1
          }
        })
        console.log('Fetched progress from API:', result.data)
        console.log('Progress map created:', progressMap)
        setTopicProgress(progressMap)
      } else {
        console.log('Progress fetch response not OK:', response.status, result)
      }
    } catch (err) {
      // Non-fatal error
      console.error('Error loading progress:', err)
    }
  }, [level])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Refresh progress when page becomes visible (e.g., when navigating back from a challenge)
  useEffect(() => {
    if (level !== 'a1') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to ensure navigation is complete
        setTimeout(() => fetchProgress(), 100)
      }
    }

    const handleFocus = () => {
      setTimeout(() => fetchProgress(), 100)
    }

    // Refresh when page becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Also refresh when window gains focus (e.g., switching tabs back)
    window.addEventListener('focus', handleFocus)
    // Refresh on page load/remount
    const intervalId = setInterval(() => {
      fetchProgress()
    }, 2000) // Refresh every 2 seconds while on page (helps catch updates)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(intervalId)
    }
  }, [level, fetchProgress])

  // Get progress for a topic from state
  const getTopicProgress = (topicName: string) => {
    // Normalize topic name for matching (trim and remove extra spaces)
    const normalizedTopic = topicName.trim().replace(/\s+/g, ' ')
    // Try exact match first, then try case-insensitive match
    let progress = topicProgress[normalizedTopic] || topicProgress[topicName]
    
    // If still not found, try case-insensitive search
    if (!progress) {
      const matchingKey = Object.keys(topicProgress).find(
        key => key.toLowerCase() === normalizedTopic.toLowerCase()
      )
      if (matchingKey) {
        progress = topicProgress[matchingKey]
      }
    }
    
    return progress || { bronze: false, silver: false, gold: false }
  }

  // Handle topic click - navigate to challenge selection
  const handleTopicClick = (topicName: string) => {
    const progress = getTopicProgress(topicName)
    const nextChallenge = !progress.bronze
      ? 'bronze'
      : !progress.silver
      ? 'silver'
      : 'gold'
    router.push(`/student/vocabulary/${level}/${encodeURIComponent(topicName)}/challenge/${nextChallenge}`)
  }

  // Get completion status for display
  const getCompletionStatus = (topicName: string) => {
    const progress = getTopicProgress(topicName)
    const completedCount = Object.values(progress).filter(Boolean).length
    return { progress, completedCount, allCompleted: completedCount === 3 }
  }

  // Get level color for styling
  const getLevelColor = () => {
    const levelMap: Record<string, string> = {
      'a1': LEVEL_COLORS.A1,
      'a2': LEVEL_COLORS.A2,
      'b1': LEVEL_COLORS.B1,
      'b2': LEVEL_COLORS.B2,
      'c1': LEVEL_COLORS.C1,
      'c2': LEVEL_COLORS.C2
    }
    return levelMap[level] || '#4A4A7D'
  }

  const levelColor = getLevelColor()
  const levelDisplay = level.toUpperCase()

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true)
      setError('')
      try {
        // Only A1 is currently available
        if (level !== 'a1') {
          setTopics([])
          setLoading(false)
          return
        }

        // Fetch topics from API route (uses service role key server-side)
        const response = await fetch(`/api/vocabulary/${level}`)
        const result = await response.json()

        if (!response.ok || result.error) {
          throw new Error(result.error || 'Error loading themes')
        }

        setTopics(result.data || [])
      } catch (err: any) {
        setError(err.message || 'Error loading themes')
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [level])

  // Fetch completion icons for topics from API route
  useEffect(() => {
    const fetchIcons = async () => {
      try {
        if (level !== 'a1') return

        const response = await fetch(`/api/vocabulary/${level}/icons`)
        const result = await response.json()

        if (!response.ok || result.error) {
          throw new Error(result.error || 'Error loading icons')
        }

        setTopicToIcon(result.data || {})
      } catch (err) {
        // non-fatal; icons are optional
      }
    }

    if (level === 'a1') fetchIcons()
  }, [level])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href="/student/vocabulary"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Vocabulary Levels
          </Link>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4" style={{ color: levelColor }}>
                Vocabulary - Level {levelDisplay}
              </h1>
              <div className="space-y-2 text-gray-700">
                <p>🎯 Complete three challenges (1, 2, 3) for each theme.</p>
                <p>🧭 You can complete the themes in any order.</p>
                <p>🏆 The goal is to learn all the words by completing all the challenges.</p>
                <p>🎉 Have fun watching your board fill up with rewards!</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr style={{ backgroundColor: levelColor, color: 'white' }}>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Theme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Number of words
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Challenge 1
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Challenge 2
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Challenge 3
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  )}
                  {error && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center" style={{ color: '#ba3627' }}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && topics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        {level === 'a1' 
                          ? 'No themes found for this level at the moment.'
                          : 'This level is coming soon. Only A1 is currently available.'}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && topics.map((topic) => {
                    const { progress, completedCount, allCompleted } = getCompletionStatus(topic.name)
                    // Debug: log progress for this topic
                    if (topic.name.toLowerCase().includes('animal')) {
                      console.log(`Topic: "${topic.name}", Progress:`, progress, 'All progress keys:', Object.keys(topicProgress))
                    }
                    return (
                      <tr 
                        key={topic.name}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleTopicClick(topic.name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {topic.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {topic.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {progress.bronze ? (
                            <span className="text-2xl">🏅</span>
                          ) : (
                            <span className="inline-block w-8 h-8 border-2 border-gray-300 rounded-full" style={{ borderColor: levelColor + '40' }}></span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {progress.silver ? (
                            <span className="text-2xl">🏅</span>
                          ) : (
                            <span className="inline-block w-8 h-8 border-2 border-gray-300 rounded-full" style={{ borderColor: levelColor + '40' }}></span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {progress.gold ? (
                            <span className="text-2xl">🏅</span>
                          ) : (
                            <span className="inline-block w-8 h-8 border-2 border-gray-300 rounded-full" style={{ borderColor: levelColor + '40' }}></span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {allCompleted ? (
                            topicToIcon[topic.name] ? (
                              <img 
                                src={topicToIcon[topic.name]} 
                                alt={`Completed icon for ${topic.name}`} 
                                className="h-10 w-10 mx-auto object-contain"
                                onError={(e) => {
                                  // Fallback to trophy if image fails to load
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent && !parent.querySelector('.fallback-trophy')) {
                                    const fallback = document.createElement('span')
                                    fallback.className = 'fallback-trophy text-2xl'
                                    fallback.textContent = '🏆'
                                    parent.appendChild(fallback)
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-2xl">🏆</span>
                            )
                          ) : (
                            <span className="text-gray-600 font-medium">{completedCount}/3</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Download Vocabulary List Button */}
            {VOCABULARY_LIST_PDFS[level] && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href={VOCABULARY_LIST_PDFS[level]}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: levelColor }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Full {levelDisplay} Vocabulary List
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

