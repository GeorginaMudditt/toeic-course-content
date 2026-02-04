'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { LEVEL_COLORS } from '@/lib/level-colors'
import Navbar from '@/components/Navbar'
import ChallengeModal from '@/components/ChallengeModal'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Word {
  word_english: string
  pron_english: string | null
  translation_french: string
  created_at?: string
  id?: string | number
}

export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const level = (params.level as string)?.toLowerCase() || 'a1'
  // Normalize topic name: trim and remove extra spaces (matching vocabulary API normalization)
  const topic = decodeURIComponent(params.topic as string).trim().replace(/\s+/g, ' ')
  const challengeType = params.challengeType as 'bronze' | 'silver' | 'gold'
  const isViewMode = searchParams.get('view') === 'true'

  const [progress, setProgress] = useState({ bronze: false, silver: false, gold: false })
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draggedWord, setDraggedWord] = useState<string | null>(null)
  const [wordPositions, setWordPositions] = useState<Record<string, string>>({})
  const [shuffledWords, setShuffledWords] = useState<string[]>([])
  const [listenedWords, setListenedWords] = useState<Set<string>>(new Set())
  const [goldInputs, setGoldInputs] = useState<Record<string, string>>({})
  const [goldErrorCount, setGoldErrorCount] = useState(0)
  const [showHelpPrompt, setShowHelpPrompt] = useState(false)
  const [helpModeEnabled, setHelpModeEnabled] = useState(false)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })

  // Load progress from API
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Normalize topic for the query
        const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
        const response = await fetch(`/api/vocabulary-progress?level=${level}&topic=${encodeURIComponent(normalizedTopic)}`)
        const result = await response.json()
        
        if (response.ok && result.data && result.data.length > 0) {
          const progressData = result.data[0]
          setProgress({
            bronze: Boolean(progressData.bronze),
            silver: Boolean(progressData.silver),
            gold: Boolean(progressData.gold)
          })
          console.log('Progress loaded for challenge page:', { level, topic: normalizedTopic, progress: progressData })
        } else {
          console.log('No progress found for:', { level, topic: normalizedTopic })
        }
      } catch (err) {
        // Non-fatal error, progress will default to all false
        console.error('Error loading progress:', err)
      }
    }
    
    fetchProgress()
  }, [level, topic])

  // Fetch words for challenges
  useEffect(() => {
    const fetchWords = async () => {
      if ((challengeType === 'bronze' || challengeType === 'silver' || challengeType === 'gold') && level === 'a1') {
        setLoading(true)
        setError('')
        try {
          // Fetch words from API route (uses service role key server-side)
          const response = await fetch(`/api/vocabulary/${level}/${encodeURIComponent(topic)}`)
          const result = await response.json()

          if (!response.ok || result.error) {
            throw new Error(result.error || 'Error loading words')
          }
          
          setWords(result.data || [])
          
          // For silver challenge, create shuffled English words
          if (challengeType === 'silver' && result.data && result.data.length > 0) {
            const englishWords = result.data.map((item: Word) => item.word_english)
            const shuffled = [...englishWords].sort(() => Math.random() - 0.5)
            setShuffledWords(shuffled)
            setWordPositions({})
          }
        } catch (err: any) {
          setError(err.message || 'Error loading words')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchWords()
  }, [level, topic, challengeType])

  // Save progress to API
  const saveProgress = async (newProgress: { bronze: boolean; silver: boolean; gold: boolean }) => {
    try {
      // Ensure topic is normalized before sending
      const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
      const payload = {
        level,
        topic: normalizedTopic,
        ...newProgress
      }
      console.log('Saving progress with payload:', payload)
      
      const response = await fetch('/api/vocabulary-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('Save API response status:', response.status, 'Response:', result)
      
      if (response.ok && !result.error) {
        setProgress(newProgress)
        console.log('Progress saved successfully:', { level, topic: normalizedTopic, ...newProgress })
        return { success: true, data: result.data }
      } else {
        console.error('Error saving progress:', result.error, 'Full response:', result, 'Status:', response.status)
        // Still update local state even if save fails
        setProgress(newProgress)
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Error saving progress (exception):', err)
      // Still update local state even if save fails
      setProgress(newProgress)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

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

  const getChallengeTitle = (type: string) => {
    const titles: Record<string, string> = {
      bronze: 'Challenge 1',
      silver: 'Challenge 2',
      gold: 'Challenge 3'
    }
    return titles[type] || 'Challenge'
  }

  const isCompleted = progress[challengeType]
  // In view mode, show the challenge even if completed (but don't allow submission)
  const shouldShowChallenge = !isCompleted || isViewMode

  // Gold challenge shuffled words
  const goldShuffled = useMemo(() => {
    if (challengeType !== 'gold' || !words?.length) return []
    const list = [...words]
    return list.sort(() => Math.random() - 0.5)
  }, [challengeType, words])

  const handleGoldInput = (french: string, value: string) => {
    setGoldInputs(prev => ({ ...prev, [french]: value }))
  }

  // Play audio for pronunciation
  const playAudio = async (audioUrl: string | null, wordKey: string) => {
    if (!audioUrl) {
      console.log('No audio URL provided for:', wordKey)
      return
    }
    
    // Validate and normalize the audio URL
    let normalizedUrl = audioUrl.trim()
    
    // Handle different URL formats
    // 1. Already a full URL - use as is (most common case)
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
      // URL is already complete - validate it
      try {
        new URL(normalizedUrl)
      } catch (e) {
        console.error('Invalid full URL format for', wordKey, ':', normalizedUrl)
        return
      }
    }
    // 2. Supabase storage paths - extract bucket and file path
    else if (normalizedUrl.includes('/storage/v1/object/')) {
      // Extract bucket and file path from storage URL
      // Format: /storage/v1/object/public/bucket/file.mp3 or storage/v1/object/public/bucket/file.mp3
      const parts = normalizedUrl.split('/storage/v1/object/public/')
      if (parts.length === 2) {
        const bucketAndPath = parts[1]
        const [bucket, ...filePathParts] = bucketAndPath.split('/')
        const filePath = filePathParts.join('/')
        
        // Use Supabase client to get public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
        normalizedUrl = data.publicUrl
        console.log('Converted storage path to public URL:', audioUrl, '->', normalizedUrl)
      } else {
        console.error('Invalid Supabase storage path format for', wordKey, ':', normalizedUrl)
        return
      }
    }
    // 3. Simple file paths - try common buckets
    else if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanPath = normalizedUrl.replace(/^\/?uploads\//, '')
      // Try common bucket names
      const buckets = ['vocabulary-audio', 'audio', 'resources', 'uploads']
      let found = false
      
      for (const bucket of buckets) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath)
        // Check if URL is accessible (we'll try to load it)
        normalizedUrl = data.publicUrl
        found = true
        console.log('Trying bucket', bucket, 'for path:', cleanPath, '->', normalizedUrl)
        break // Use first bucket for now
      }
      
      if (!found) {
        console.error('Could not determine bucket for path:', normalizedUrl, 'for word:', wordKey)
        return
      }
    }
    // 4. Invalid format
    else {
      console.error('Invalid audio URL format for', wordKey, ':', normalizedUrl)
      console.error('Expected format: full URL (https://...) or Supabase storage path')
      console.error('URL formats supported:')
      console.error('  - Full URL: https://...')
      console.error('  - Storage path: /storage/v1/object/public/bucket/file.mp3')
      console.error('  - Upload path: /uploads/file.mp3 or uploads/file.mp3')
      return
    }
    
    // Validate URL format
    try {
      const url = new URL(normalizedUrl)
      if (!url.protocol.startsWith('http')) {
        console.error('Invalid audio URL protocol:', normalizedUrl)
        return
      }
    } catch (e) {
      console.error('Invalid audio URL format (cannot parse as URL):', normalizedUrl, 'for word:', wordKey)
      return
    }
    
    // Add cache-busting query parameter to prevent old audio from being cached
    const cacheBuster = `?t=${Date.now()}`
    const finalUrl = normalizedUrl.includes('?') 
      ? `${normalizedUrl}&t=${Date.now()}` 
      : `${normalizedUrl}${cacheBuster}`
    
    console.log('Playing audio for:', wordKey, 'Original URL:', audioUrl, 'Final URL:', finalUrl)
    
    const audio = new Audio(finalUrl)
    
    // Add error handlers for better debugging
    audio.addEventListener('error', (e) => {
      console.error('Audio error for', wordKey, ':', e)
      const error = audio.error
      if (error) {
        const errorDetails = {
          code: error.code,
          message: error.message,
          codeName: error.code === MediaError.MEDIA_ERR_ABORTED ? 'MEDIA_ERR_ABORTED' :
                   error.code === MediaError.MEDIA_ERR_NETWORK ? 'MEDIA_ERR_NETWORK' :
                   error.code === MediaError.MEDIA_ERR_DECODE ? 'MEDIA_ERR_DECODE' :
                   error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ? 'MEDIA_ERR_SRC_NOT_SUPPORTED' : 'UNKNOWN',
          url: finalUrl,
          originalUrl: audioUrl
        }
        console.error('Audio error details:', errorDetails)
        
        // Show user-friendly error
        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          console.error('❌ Audio format not supported or file not found:', finalUrl)
        }
      }
    })
    
    audio.addEventListener('loadstart', () => {
      console.log('Audio loading started for:', wordKey)
    })
    
    audio.addEventListener('canplay', () => {
      console.log('Audio can play for:', wordKey)
    })
    
    audio.addEventListener('loadeddata', () => {
      console.log('Audio data loaded for:', wordKey)
    })
    
    audio.play()
      .then(() => {
        setListenedWords(prev => new Set(prev).add(wordKey))
        console.log('✅ Audio playback started for:', wordKey)
      })
      .catch(err => {
        console.error('❌ Audio playback failed for', wordKey, ':', err, 'URL:', finalUrl)
        // Try to get more details about the error
        if (audio.error) {
          console.error('Audio element error:', {
            code: audio.error.code,
            message: audio.error.message,
            url: finalUrl,
            originalUrl: audioUrl
          })
        }
      })
  }

  // Drag and drop functions for silver challenge
  const handleDragStart = (e: React.DragEvent, word: string) => {
    setDraggedWord(word)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, frenchTranslation: string) => {
    e.preventDefault()
    if (!draggedWord) return

    setWordPositions(prev => {
      const newPositions = { ...prev }

      // If this drop zone already had a word, return it to the pool
      const wordBeingReplaced = newPositions[frenchTranslation]
      if (wordBeingReplaced) {
        setShuffledWords(prevPool => (
          prevPool.includes(wordBeingReplaced) ? prevPool : [...prevPool, wordBeingReplaced]
        ))
      }

      // Remove the dragged word from any previous drop zone
      for (const key of Object.keys(newPositions)) {
        if (newPositions[key] === draggedWord) {
          delete newPositions[key]
          break
        }
      }

      // Place the dragged word in the current drop zone
      newPositions[frenchTranslation] = draggedWord

      // Remove the dragged word from the pool on the right
      setShuffledWords(prevPool => prevPool.filter(w => w !== draggedWord))

      return newPositions
    })

    setDraggedWord(null)
  }

  const removeWord = (frenchTranslation: string) => {
    setWordPositions(prev => {
      const newPositions = { ...prev }
      const removed = newPositions[frenchTranslation]
      delete newPositions[frenchTranslation]
      if (removed) {
        // Return the word to the pool on the right (avoid duplicates)
        setShuffledWords(prevPool => (
          prevPool.includes(removed) ? prevPool : [...prevPool, removed]
        ))
      }
      return newPositions
    })
  }

  const completeChallenge = async () => {
    // For bronze challenge, ensure all audio have been listened to at least once
    if (challengeType === 'bronze') {
      if (words.length === 0 || listenedWords.size < words.length) {
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Not Quite Ready',
          message: 'Please listen to all words at least once before continuing.'
        })
        return
      }
    }
    
    // For silver challenge, check if all words are correctly positioned
    if (challengeType === 'silver') {
      const allCorrect = words.every(word => 
        wordPositions[word.translation_french] === word.word_english
      )
      if (!allCorrect) {
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Oops!',
          message: "You made some mistakes. Please try again. Each English word must be correctly matched to its French translation to complete this challenge. Good luck!"
        })
        return
      }
    }
    
    // For gold challenge, validate typed answers (strict match)
    if (challengeType === 'gold') {
      const allCorrect = words.every(word => {
        const userRaw = goldInputs[word.translation_french] || ''
        const user = userRaw.replace(/\s+/g, ' ').trim() // tolerate extra spaces only
        return user === word.word_english
      })
      if (!allCorrect) {
        const newErrorCount = goldErrorCount + 1
        setGoldErrorCount(newErrorCount)
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Oops!',
          message: "You made some mistakes. Please try again. Each English word must be spelled and punctuated correctly to complete this challenge. Good luck!"
        })
        
        // After 2 errors, show help prompt after modal closes
        if (newErrorCount >= 2 && !helpModeEnabled) {
          // The help prompt will be shown in handleModalClose
        }
        return
      }
    }
    
    // Fetch latest progress from API before updating to ensure we don't overwrite existing progress
    let latestProgress = { ...progress }
    try {
      const normalizedTopic = topic.trim().replace(/\s+/g, ' ')
      const response = await fetch(`/api/vocabulary-progress?level=${level}&topic=${encodeURIComponent(normalizedTopic)}`)
      const result = await response.json()
      
      if (response.ok && result.data && result.data.length > 0) {
        const progressData = result.data[0]
        latestProgress = {
          bronze: Boolean(progressData.bronze),
          silver: Boolean(progressData.silver),
          gold: Boolean(progressData.gold)
        }
        console.log('Fetched latest progress before save:', latestProgress)
      } else {
        console.log('No existing progress found, using current state:', latestProgress)
      }
    } catch (err) {
      console.error('Error fetching latest progress before save:', err)
      // Continue with current progress state
    }
    
    // Update progress: preserve existing values and set current challenge to true
    const newProgress = { ...latestProgress, [challengeType]: true }
    console.log(`Completing ${challengeType} challenge. Current progress state:`, progress, 'Latest from API:', latestProgress, 'New progress to save:', newProgress)
    
    // Save progress and wait for it to complete
    const saveResult = await saveProgress(newProgress)
    console.log('Save result:', saveResult)
    
    // Verify the save was successful before showing success modal
    if (!saveResult.success) {
      console.error('Failed to save progress:', saveResult.error)
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error Saving Progress',
        message: `There was an error saving your progress. Please try again. Error: ${saveResult.error || 'Unknown error'}`
      })
      return
    }

    // Verify the saved data matches what we expected
    if (saveResult.data) {
      const saved = saveResult.data
      console.log('Verifying saved data:', {
        expected: newProgress,
        saved: {
          bronze: saved.bronze,
          silver: saved.silver,
          gold: saved.gold
        },
        match: saved.bronze === newProgress.bronze && 
               saved.silver === newProgress.silver && 
               saved.gold === newProgress.gold
      })
    }

    // Show success modal
    setModalState({
      isOpen: true,
      type: 'success',
      title: 'Congratulations!',
      message: `You have successfully completed ${getChallengeTitle(challengeType).toLowerCase()} on the theme "${topic}".`
    })
  }

  const handleModalClose = () => {
    const wasSuccess = modalState.type === 'success'
    const wasError = modalState.type === 'error'
    setModalState(prev => ({ ...prev, isOpen: false }))
    
    // If it was a success modal, navigate to next challenge
    // Add a small delay to ensure the save is fully committed
    if (wasSuccess) {
      setTimeout(() => {
        if (challengeType === 'bronze') {
          router.push(`/student/vocabulary/${level}/${encodeURIComponent(topic)}/challenge/silver`)
        } else if (challengeType === 'silver') {
          router.push(`/student/vocabulary/${level}/${encodeURIComponent(topic)}/challenge/gold`)
        } else {
          // When completing gold, go back to the vocabulary list
          router.push(`/student/vocabulary/${level}`)
        }
      }, 500) // Increased delay to ensure save completes
    }
    
    // For gold challenge, after closing error modal, check if we should show help prompt
    // Only show once after 2 errors, if help mode is not already enabled
    if (challengeType === 'gold' && wasError && !helpModeEnabled) {
      setTimeout(() => {
        if (goldErrorCount >= 2) {
          setShowHelpPrompt(true)
        }
      }, 300) // Small delay to let error modal close smoothly
    }
  }
  
  const handleHelpPromptResponse = (accept: boolean) => {
    setShowHelpPrompt(false)
    if (accept) {
      setHelpModeEnabled(true)
    }
  }
  
  // Check if a gold challenge answer is correct
  const isGoldAnswerCorrect = (frenchTranslation: string): boolean => {
    const word = words.find(w => w.translation_french === frenchTranslation)
    if (!word) return false
    const userRaw = goldInputs[frenchTranslation] || ''
    const user = userRaw.replace(/\s+/g, ' ').trim()
    return user === word.word_english
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: levelColor }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ChallengeModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        levelColor={levelColor}
      />
      {/* Help Prompt Modal */}
      {showHelpPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${levelColor}20` }}
                  >
                    <svg
                      className="w-10 h-10"
                      style={{ color: levelColor }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
                  Do you want some help?
                </h3>
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                  We can show you which words are correct and which ones need correction.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleHelpPromptResponse(false)}
                    className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-md font-semibold transition-colors hover:bg-gray-50"
                  >
                    No, thanks
                  </button>
                  <button
                    onClick={() => handleHelpPromptResponse(true)}
                    className="flex-1 py-3 px-4 text-white rounded-md font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: levelColor }}
                  >
                    Yes, please
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href={`/student/vocabulary/${level}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Vocabulary
          </Link>

          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-4" style={{ color: levelColor }}>
              {getChallengeTitle(challengeType)} - {topic}
            </h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                Error: {error}
              </div>
            )}

            {isCompleted && !isViewMode ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-xl text-gray-700 mb-4">You have already completed this challenge!</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => router.push(`/student/vocabulary/${level}/${encodeURIComponent(topic)}/challenge/bronze?view=true`)}
                    className="px-6 py-2 text-white rounded-md transition-opacity hover:opacity-90"
                    style={{ backgroundColor: levelColor }}
                  >
                    View the "{topic}" challenges again
                  </button>
                  <Link
                    href={`/student/vocabulary/${level}`}
                    className="inline-block px-6 py-2 border-2 rounded-md transition-colors hover:bg-gray-50"
                    style={{ borderColor: levelColor, color: levelColor }}
                  >
                    Return to Vocabulary Themes
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  You can view the challenges again to review the vocabulary and listen to audio, but you won't be able to resubmit them.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {isViewMode && isCompleted && (
                  <div className="mb-6 space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>View Mode:</strong> You're viewing this completed challenge. You can review the vocabulary and listen to audio, but you cannot resubmit it.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/student/vocabulary/${level}/${encodeURIComponent(topic)}/challenge/bronze?view=true`)}
                        className={`px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90 ${
                          challengeType === 'bronze' 
                            ? 'text-white' 
                            : 'border-2 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={challengeType === 'bronze' ? { backgroundColor: levelColor } : { borderColor: levelColor, color: levelColor }}
                      >
                        Challenge 1 {progress.bronze ? '✓' : ''}
                      </button>
                      <button
                        onClick={() => router.push(`/student/vocabulary/${level}/${encodeURIComponent(topic)}/challenge/silver?view=true`)}
                        className={`px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90 ${
                          challengeType === 'silver' 
                            ? 'text-white' 
                            : 'border-2 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={challengeType === 'silver' ? { backgroundColor: levelColor } : { borderColor: levelColor, color: levelColor }}
                      >
                        Challenge 2 {progress.silver ? '✓' : ''}
                      </button>
                      <button
                        onClick={() => router.push(`/student/vocabulary/${level}/${encodeURIComponent(topic)}/challenge/gold?view=true`)}
                        className={`px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90 ${
                          challengeType === 'gold' 
                            ? 'text-white' 
                            : 'border-2 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={challengeType === 'gold' ? { backgroundColor: levelColor } : { borderColor: levelColor, color: levelColor }}
                      >
                        Challenge 3 {progress.gold ? '✓' : ''}
                      </button>
                    </div>
                  </div>
                )}
                {challengeType === 'bronze' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2" style={{ color: levelColor }}>
                        Listen and read all the words
                      </h3>
                      <p className="text-gray-600">
                        Click the 🔊 icon to listen to the pronunciation of each English word, then read the French translation.
                      </p>
                    </div>
                    
                    {words.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {words.map((word, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-white flex flex-col">
                            <div className="flex-1 mb-3">
                              <div className="font-semibold text-gray-900 mb-1 text-sm">
                                {word.word_english}
                              </div>
                              <div className="text-gray-600 text-sm italic">
                                {word.translation_french}
                              </div>
                            </div>
                            {word.pron_english && (
                              <button
                                onClick={() => playAudio(word.pron_english, word.word_english)}
                                className="w-full px-3 py-2 rounded-md text-white text-lg transition-opacity hover:opacity-80"
                                style={{ backgroundColor: levelColor }}
                                title="Listen to pronunciation"
                              >
                                🔊
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 mb-6">No words found for this theme.</p>
                    )}
                    
                    {!isViewMode ? (
                      <>
                        <button
                          onClick={completeChallenge}
                          disabled={words.length === 0 || listenedWords.size < words.length}
                          className="px-6 py-3 text-white rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: levelColor }}
                        >
                          Complete Challenge 1
                        </button>
                        {words.length > 0 && listenedWords.size < words.length && (
                          <p className="text-sm text-gray-500 mt-2">
                            Please listen to all {words.length} words before completing (listened: {listenedWords.size}/{words.length})
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                        <p className="text-gray-600 text-sm">
                          <strong>Challenge completed.</strong> You can review the words and listen to audio, but this challenge cannot be resubmitted.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {challengeType === 'silver' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2" style={{ color: levelColor }}>
                        Match the words
                      </h3>
                      <p className="text-gray-600">
                        Drag the English words (coloured cards) to the boxes next to their corresponding French translations. Click a placed card to return it to the list.
                      </p>
                    </div>
                    
                    {words.length > 0 ? (
                      <div className="mb-6">
                        {/* English words pool */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                          <h4 className="font-semibold text-gray-900 mb-4">English words to drag</h4>
                          <div className="flex flex-wrap gap-3">
                            {shuffledWords.map((word, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 rounded text-white cursor-move transition-opacity hover:opacity-80 text-sm"
                                style={{ backgroundColor: levelColor }}
                                draggable
                                onDragStart={(e) => handleDragStart(e, word)}
                              >
                                {word}
                              </div>
                            ))}
                          </div>
                          {shuffledWords.length === 0 && (
                            <p className="text-gray-500 text-sm italic">All words have been placed!</p>
                          )}
                        </div>

                        {/* Match area - responsive grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {words.map((word, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-white">
                              <div className="font-semibold text-gray-900 mb-2 text-sm">
                                {word.translation_french}
                              </div>
                              <div
                                className="min-h-[60px] border-2 border-dashed rounded p-2 bg-gray-50 transition-colors hover:bg-gray-100"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, word.translation_french)}
                              >
                                {wordPositions[word.translation_french] ? (
                                  <div
                                    className="inline-block px-3 py-2 rounded text-white text-sm cursor-pointer transition-opacity hover:opacity-80 break-words"
                                    style={{ backgroundColor: levelColor }}
                                    onClick={() => removeWord(word.translation_french)}
                                    title="Click to remove"
                                  >
                                    {wordPositions[word.translation_french]}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-xs">Drop here</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 mb-6">No words found for this theme.</p>
                    )}
                    
                    {!isViewMode ? (
                      <button
                        onClick={completeChallenge}
                        className="px-6 py-3 text-white rounded-md transition-opacity hover:opacity-90"
                        style={{ backgroundColor: levelColor }}
                      >
                        Complete Challenge 2
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                        <p className="text-gray-600 text-sm">
                          <strong>Challenge completed.</strong> You can review the words and practice matching, but this challenge cannot be resubmitted.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {challengeType === 'gold' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2" style={{ color: levelColor }}>
                        Write the words in English
                      </h3>
                      <p className="text-gray-600">
                        For each French word, type the corresponding English word in the box. Spelling and punctuation must be exact.
                      </p>
                    </div>

                    {goldShuffled.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {goldShuffled.map((word, index) => {
                          const hasInput = (goldInputs[word.translation_french] || '').trim().length > 0
                          const isCorrect = helpModeEnabled && hasInput ? isGoldAnswerCorrect(word.translation_french) : null
                          
                          return (
                            <div key={index} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block font-semibold text-gray-900 text-sm">
                                  {word.translation_french}
                                </label>
                                {helpModeEnabled && hasInput && (
                                  <span className="text-xl">
                                    {isCorrect ? (
                                      <span className="text-green-600" title="Correct">✓</span>
                                    ) : (
                                      <span className="text-red-600" title="Incorrect">✗</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                                  helpModeEnabled && hasInput
                                    ? isCorrect
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-red-500 bg-red-50'
                                    : 'border-gray-300'
                                }`}
                                placeholder="English word"
                                value={goldInputs[word.translation_french] || ''}
                                onChange={(e) => handleGoldInput(word.translation_french, e.target.value)}
                                onFocus={(e) => {
                                  if (!helpModeEnabled || !hasInput) {
                                    e.currentTarget.style.borderColor = levelColor
                                    e.currentTarget.style.boxShadow = `0 0 0 2px ${levelColor}40`
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!helpModeEnabled || !hasInput) {
                                    e.currentTarget.style.borderColor = '#d1d5db'
                                    e.currentTarget.style.boxShadow = 'none'
                                  }
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 mb-6">No words found for this theme.</p>
                    )}

                    {!isViewMode ? (
                      <button
                        onClick={completeChallenge}
                        className="px-6 py-3 text-white rounded-md transition-opacity hover:opacity-90"
                        style={{ backgroundColor: levelColor }}
                      >
                        Complete Challenge 3
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                        <p className="text-gray-600 text-sm">
                          <strong>Challenge completed.</strong> You can review the words and practice typing, but this challenge cannot be resubmitted.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

