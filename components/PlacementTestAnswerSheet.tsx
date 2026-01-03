'use client'

import { useState, useEffect } from 'react'

interface PlacementTestAnswers {
  listening: {
    photographs: {
      q1: string // A, B, C, or D
      q2: string
    }
    conversations: {
      q1_1: string // Question 1, sub-question 1
      q1_2: string
      q1_3: string
      q2_1: string
      q2_2: string
      q2_3: string
    }
  }
  speaking: {
    readAloud: string // "completed" indicator (no notes allowed)
    expressOpinion: string // "completed" indicator (no notes allowed)
  }
  writingFileUrl?: string // URL of uploaded writing response file
  reading: {
    incompleteSentences: {
      q1: string
      q2: string
      q3: string
      q4: string
      q5: string
      q6: string
    }
    readingComprehension: {
      q1: string
      q2: string
      q3: string
    }
  }
  writing: string // Full text response
}

interface PlacementTestAnswerSheetProps {
  assignmentId: string
  initialAnswers?: string | null
  onSave: (answers: string) => void
}

export default function PlacementTestAnswerSheet({ 
  assignmentId, 
  initialAnswers,
  onSave 
}: PlacementTestAnswerSheetProps) {
  const [answers, setAnswers] = useState<PlacementTestAnswers>({
    listening: {
      photographs: { q1: '', q2: '' },
      conversations: { q1_1: '', q1_2: '', q1_3: '', q2_1: '', q2_2: '', q2_3: '' }
    },
    speaking: {
      readAloud: '',
      expressOpinion: ''
    },
    reading: {
      incompleteSentences: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '' },
      readingComprehension: { q1: '', q2: '', q3: '' }
    },
    writing: '',
    writingFileUrl: undefined
  })

  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  // Load initial answers if they exist
  useEffect(() => {
    if (initialAnswers) {
      try {
        const parsed = JSON.parse(initialAnswers)
        setAnswers(parsed)
        if (parsed.writingFileUrl) {
          // Extract filename from URL
          const urlParts = parsed.writingFileUrl.split('/')
          const filename = urlParts[urlParts.length - 1]
          setUploadedFileName(filename)
        }
      } catch (e) {
        // If not JSON, treat as old format and ignore
      }
    }
  }, [initialAnswers])

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSave = setInterval(async () => {
      // Check if there are any answers to save
      const hasAnswers = 
        answers.listening.photographs.q1 || 
        answers.listening.photographs.q2 || 
        answers.listening.conversations.q1_1 ||
        answers.reading.incompleteSentences.q1 || 
        answers.reading.readingComprehension.q1 ||
        answers.writing ||
        answers.writingFileUrl

      if (hasAnswers) {
        try {
          const answersJson = JSON.stringify(answers, null, 2)
          await onSave(answersJson)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSave)
  }, [answers, onSave])

  const handleAnswerChange = (path: string, value: string) => {
    setAnswers(prev => {
      const newAnswers = JSON.parse(JSON.stringify(prev)) // Deep clone
      const keys = path.split('.')
      let current: any = newAnswers
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newAnswers
    })
  }

  const handleNestedAnswerChange = (section: string, subsection: string, question: string, value: string) => {
    setAnswers(prev => {
      const newAnswers = JSON.parse(JSON.stringify(prev)) // Deep clone
      if (subsection) {
        newAnswers[section][subsection][question] = value
      } else {
        newAnswers[section][question] = value
      }
      return newAnswers
    })
  }

  const handleSave = async (silent = false) => {
    if (!silent) {
      setSaving(true)
    }
    try {
      const answersJson = JSON.stringify(answers, null, 2)
      await onSave(answersJson)
    } catch (error) {
      console.error('Failed to save answers:', error)
      if (!silent) {
        alert('Failed to save answers. Please try again.')
      }
    } finally {
      if (!silent) {
        setSaving(false)
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    
    if (!isImage && !isPDF) {
      alert('Please upload a JPG, PNG, or PDF file.')
      e.target.value = ''
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit. Please choose a smaller file.')
      e.target.value = ''
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/assignments/${assignmentId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const fileUrl = data.path || data.url || (data.files && data.files[0]?.path)
        
        if (fileUrl) {
          setAnswers(prev => ({ ...prev, writingFileUrl: fileUrl }))
          setUploadedFileName(file.name)
          // Auto-save after file upload
          setTimeout(() => {
            const updatedAnswers = { ...answers, writingFileUrl: fileUrl }
            handleSave(true)
          }, 100)
        } else {
          throw new Error('No file URL returned')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        alert(errorData.error || 'Failed to upload file. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">Answer Sheet</h3>
        <div className="flex items-center space-x-3">
          {saving && (
            <span className="text-sm text-gray-500">Saving...</span>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: '#38438f' }}
          >
            {saving ? 'Saving...' : 'Save Answers'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your answers are automatically saved every 30 seconds.
        </p>
      </div>

      {/* Listening Section */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Listening</h4>
        
        {/* Photographs */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-700 mb-3">Photographs</h5>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium w-8">1.</span>
              <div className="flex space-x-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="photo1"
                      value={option}
                      checked={answers.listening.photographs.q1 === option}
                      onChange={(e) => handleNestedAnswerChange('listening', 'photographs', 'q1', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium w-8">2.</span>
              <div className="flex space-x-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="photo2"
                      value={option}
                      checked={answers.listening.photographs.q2 === option}
                      onChange={(e) => handleNestedAnswerChange('listening', 'photographs', 'q2', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conversations */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-700 mb-3">Conversations</h5>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Conversation 1</p>
              <div className="space-y-2 ml-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center space-x-4">
                    <span className="text-sm w-12">{num}.</span>
                    <div className="flex space-x-4">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`conv1_q${num}`}
                            value={option}
                            checked={answers.listening.conversations[`q1_${num}` as keyof typeof answers.listening.conversations] === option}
                            onChange={(e) => handleNestedAnswerChange('listening', 'conversations', `q1_${num}`, e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Conversation 2</p>
              <div className="space-y-2 ml-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center space-x-4">
                    <span className="text-sm w-12">{num}.</span>
                    <div className="flex space-x-4">
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`conv2_q${num}`}
                            value={option}
                            checked={answers.listening.conversations[`q2_${num}` as keyof typeof answers.listening.conversations] === option}
                            onChange={(e) => handleNestedAnswerChange('listening', 'conversations', `q2_${num}`, e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speaking Section */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Speaking</h4>
        <p className="text-sm text-gray-600 mb-2">
          Speaking tasks will be completed during your Teams session with your teacher.
        </p>
        <p className="text-xs text-gray-500 italic">
          Note: In the real TOEIC test, you cannot make notes during the speaking section.
        </p>
      </div>

      {/* Reading Section */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Reading</h4>
        
        {/* Incomplete Sentences */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-700 mb-3">Incomplete Sentences</h5>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className="flex items-center space-x-4">
                <span className="text-sm font-medium w-8">{num}.</span>
                <input
                  type="text"
                  value={answers.reading.incompleteSentences[`q${num}` as keyof typeof answers.reading.incompleteSentences]}
                  onChange={(e) => handleNestedAnswerChange('reading', 'incompleteSentences', `q${num}`, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm w-32"
                  placeholder="Answer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reading Comprehension */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-700 mb-3">Reading Comprehension</h5>
          <div className="space-y-3">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center space-x-4">
                <span className="text-sm font-medium w-8">{num}.</span>
                <div className="flex space-x-4">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`reading_comp_q${num}`}
                        value={option}
                        checked={answers.reading.readingComprehension[`q${num}` as keyof typeof answers.reading.readingComprehension] === option}
                        onChange={(e) => handleNestedAnswerChange('reading', 'readingComprehension', `q${num}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Writing Section */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Writing</h4>
        <textarea
          value={answers.writing}
          onChange={(e) => handleAnswerChange('writing', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={8}
          placeholder="Type your written response here..."
        />
        <p className="text-xs text-gray-500 mt-2">
          Tip: You can also write your response on paper and upload a photo using the file upload option below.
        </p>
      </div>

      {/* File Upload for Writing (optional) */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Upload Writing Response (Optional)</h4>
        <p className="text-sm text-gray-600 mb-2">
          If you wrote your response on paper, you can take a photo and upload it here.
        </p>
        {uploadedFileName ? (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✓ File uploaded: <strong>{uploadedFileName}</strong>
            </p>
            {answers.writingFileUrl && (
              <a
                href={answers.writingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#38438f] hover:underline mt-1 inline-block"
              >
                View uploaded file →
              </a>
            )}
            <button
              onClick={() => {
                setAnswers(prev => ({ ...prev, writingFileUrl: undefined }))
                setUploadedFileName(null)
                handleSave(true)
              }}
              className="text-sm text-red-600 hover:text-red-800 mt-2 block"
            >
              Remove file
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={uploadingFile}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#38438f] file:text-white hover:file:bg-[#2d3569] disabled:opacity-50"
          />
        )}
        {uploadingFile && (
          <p className="text-sm text-gray-600 mt-2">Uploading file... Please wait.</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Accepted formats: JPG, PNG, PDF (max 10MB)
        </p>
      </div>
    </div>
  )
}
