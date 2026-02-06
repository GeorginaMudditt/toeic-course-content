import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import CollapsibleSection from '@/components/CollapsibleSection'

export default async function TOEICInfoPage({ searchParams }: { searchParams: { viewAs?: string } }) {
  const session = await getServerSession(authOptions)
  const viewAs = searchParams?.viewAs
  
  // Allow teachers to view if they have viewAs parameter
  if (viewAs && session?.user.role === 'TEACHER') {
    // Teacher viewing as student - allow access
  } else if (!session || session.user.role !== 'STUDENT') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link
            href={viewAs ? `/teacher/students/${viewAs}/view` : '/student/dashboard'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">About the TOEIC® 4-Skills Test</h1>
              <div className="hidden md:block">
                <img
                  src="/images/TOEIC-4-Skills-logo-green.png"
                  alt="TOEIC 4-Skills"
                  className="h-16"
                />
              </div>
            </div>
            <div className="md:hidden flex justify-center">
              <img
                src="/images/TOEIC-4-Skills-logo-green.png"
                alt="TOEIC 4-Skills"
                className="h-12"
              />
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white shadow rounded-lg p-4 mb-6 sticky top-4 z-10">
            <nav className="flex flex-wrap gap-4 justify-center">
              <a 
                href="#test-duration" 
                className="text-sm font-medium transition-colors hover:text-[#38438f]"
                style={{ color: '#38438f' }}
              >
                Duration
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="#test-format" 
                className="text-sm font-medium transition-colors hover:text-[#38438f]"
                style={{ color: '#38438f' }}
              >
                Format
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="#test-scoring" 
                className="text-sm font-medium transition-colors hover:text-[#38438f]"
                style={{ color: '#38438f' }}
              >
                Scoring
              </a>
            </nav>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="prose max-w-none">
              <div className="space-y-6 text-gray-700">
                <div>
                  <p className="text-lg mb-4">
                    The TOEIC® (Test of English for International Communication) is a standardised test that measures 
                    your English language proficiency for the workplace.
                  </p>
                  <p className="text-lg">
                    The TOEIC® 4-Skills tests measure, in a single test session, the level of oral and written comprehension, 
                    and oral and written expression skills in English from beginner to advanced levels in a professional 
                    context and in an everyday life setting.
                  </p>
                </div>

                <div id="test-duration" className="scroll-mt-24">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ color: '#38438f' }}>Test Duration</h2>
                  <ul className="space-y-2 list-none">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Listening:</span>
                      <span>25 minutes (45 questions)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Speaking:</span>
                      <span>20 minutes (5 tasks)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Reading:</span>
                      <span>37 minutes (45 questions)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Writing:</span>
                      <span>60 minutes (3 tasks)</span>
                    </li>
                  </ul>
                </div>

                <div id="test-format" className="scroll-mt-24">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ color: '#38438f' }}>Test Format</h2>
                  <p className="text-gray-700 mb-6">
                    The TOEIC® 4-Skills test is taken in one sitting, delivered on a computer, and the Speaking and Writing sections are assessed by trained human raters.
                  </p>
                  
                  <div className="space-y-4">
                    <CollapsibleSection title="Listening">
                      <div className="bg-gray-50 border-l-4 border-gray-300 pl-4 py-2 mb-4 space-y-2">
                        <p className="text-gray-700 italic">Test takers only listen to each recording ONCE.</p>
                        <p className="text-gray-700 italic">The Listening test is adaptive. This means that the results obtained in the first part of the test determine the difficulty level of the questions in the second part of the test.</p>
                      </div>
                      <ul className="space-y-2 ml-4 list-disc text-gray-700">
                        <li>
                          <strong>Photographs (3 questions)</strong> - Test takers see some photos; for each photo they have to choose 
                          the sentence that describes it from the 4 options they hear.
                        </li>
                        <li>
                          <strong>Questions - Responses (9 questions)</strong> - Test takers hear some questions; each time they have 
                          to choose the best response from 3 possible options they hear.
                        </li>
                        <li>
                          <strong>Conversations (18 questions : 6 dialogues with 3 questions each)</strong> - Test takers listen to some dialogues; there are 3 multiple-choice 
                          questions to answer about each dialogue. The questions and the multiple-choice options are shown 
                          on the screen.
                        </li>
                        <li>
                          <strong>Talks (15 questions : 5 talks with 3 questions each)</strong> - Test takers listen to some monologues; there are 3 multiple-choice questions 
                          to answer about each talk.
                        </li>
                      </ul>
                    </CollapsibleSection>

                    <CollapsibleSection title="Speaking">
                      <ul className="space-y-2 ml-4 list-disc text-gray-700">
                        <li>
                          <strong>Read Aloud (2 texts)</strong> - Test takers have time to read the texts first, then they read them aloud. This section tests pronunciation, intonation and stress.
                        </li>
                        <li>
                          <strong>Photographs (2 photographs)</strong> - Test takers see some photos; they have to speak about each picture, describing what they can see.
                        </li>
                        <li>
                          <strong>Questions (1 topic, 3 questions)</strong> - Test takers have to respond to questions on an everyday topic.
                        </li>
                        <li>
                          <strong>Questions Using Information Provided (1 schedule, 3 questions)</strong> - Test takers see a schedule of events on the screen; they have to answer questions based on the information provided.
                        </li>
                        <li>
                          <strong>Opinion (1 topic)</strong> - Test takers are presented with a specific topic; they have to express their opinion on this topic.
                        </li>
                      </ul>
                    </CollapsibleSection>

                    <CollapsibleSection title="Reading">
                      <div className="bg-gray-50 border-l-4 border-gray-300 pl-4 py-2 mb-4">
                        <p className="text-gray-700 italic">The Reading test is adaptive. This means that the results obtained in the first part of the test determine the difficulty level of the questions in the second part of the test.</p>
                      </div>
                      <ul className="space-y-2 ml-4 list-disc text-gray-700">
                        <li>
                          <strong>Incomplete Sentences (12 questions)</strong> - Test takers read a phrase with a missing word; they have 
                          to choose which word completes the sentence from a choice of 4 options. This section tests grammar 
                          and vocabulary.
                        </li>
                        <li>
                          <strong>Text Completion (8 questions)</strong> - Test takers read longer texts with 4 blanks each; for each blank, 
                          they must choose how to complete the sentence from 4 options. This section also tests grammar and 
                          vocabulary.
                        </li>
                        <li>
                          <strong>Reading Comprehension (25 questions)</strong> - Test takers read short texts and answer multiple-choice 
                          comprehension questions about each.
                        </li>
                      </ul>
                    </CollapsibleSection>

                    <CollapsibleSection title="Writing">
                      <ul className="space-y-2 ml-4 list-disc text-gray-700">
                        <li>
                          <strong>Photos (5 photos)</strong> - Test takers see a selection of photos, each with two words or phrases to use in a sentence; they must write a sentence to describe each picture, using the two words/phrases given in each case.
                        </li>
                        <li>
                          <strong>Response (2 emails)</strong> - Test takers see email messages, with some information about what they should include in their response; they write a response to the emails.
                        </li>
                        <li>
                          <strong>Essay (1 topic)</strong> - Test takers are given a topic; they are then asked to give their opinion on the topic. The essay should be a minimum of 300 words.
                        </li>
                      </ul>
                    </CollapsibleSection>

                    <div className="mt-6 pt-6 border-t">
                      <p className="text-gray-700 mb-3">
                        For more information about the test format, please refer to the official TOEIC® documentation:
                      </p>
                      <ul className="space-y-2 ml-4 list-disc text-gray-700">
                        <li>
                          <a 
                            href="https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/sign/toeic/toeic-listening-reading-test-examinee-handbook.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YzZhNjMzNi1iOWJkLTRlNDAtOTNmMS0wNmIzYWNkYmU3Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0b2VpYy90b2VpYy1saXN0ZW5pbmctcmVhZGluZy10ZXN0LWV4YW1pbmVlLWhhbmRib29rLnBkZiIsImlhdCI6MTc2NjU2MjE0NiwiZXhwIjoyMDgxOTIyMTQ2fQ.Q8cAdoGUbNdddu4P1Q0BZYxQufaCbnf77jwYylvaRIQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline transition-colors hover:opacity-80"
                            style={{ color: '#38438f' }}
                          >
                            Listening and Reading Examinee Handbook
                          </a>
                        </li>
                        <li>
                          <a 
                            href="https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/sign/toeic/toeic-speaking-writing-examinee-handbook.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YzZhNjMzNi1iOWJkLTRlNDAtOTNmMS0wNmIzYWNkYmU3Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0b2VpYy90b2VpYy1zcGVha2luZy13cml0aW5nLWV4YW1pbmVlLWhhbmRib29rLnBkZiIsImlhdCI6MTc2NjU2MjE5MSwiZXhwIjoyMDgxOTIyMTkxfQ.F5tvItN_j3ZXSG_En9X8FGW8GNfC_jr-ne9Ipnk0BvY"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline transition-colors hover:opacity-80"
                            style={{ color: '#38438f' }}
                          >
                            Speaking and Writing Examinee Handbook
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div id="test-scoring" className="scroll-mt-24">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4" style={{ color: '#38438f' }}>Test Scoring</h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      The TOEIC® 4-Skills test is not a "pass" or "fail" test. Regardless of your level, you will receive a score report showing your score and corresponding CEFR level for each of the four skills.
                    </p>
                    
                    <div>
                      <ul className="space-y-2 list-none">
                        <li className="flex items-start">
                          <span className="font-medium mr-2">Listening:</span>
                          <span>This section is scored from 5 to 495 points.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium mr-2">Speaking:</span>
                          <span>This section is scored from 0 to 200 points.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium mr-2">Reading:</span>
                          <span>This section is scored from 5 to 495 points.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-medium mr-2">Writing:</span>
                          <span>This section is scored from 0 to 200 points.</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-3">Here are the Score Descriptors:</p>
                      <ul className="space-y-2 ml-4 list-disc">
                        <li>
                          <a 
                            href="https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/sign/toeic/toeic-listening-reading-score-descriptors.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YzZhNjMzNi1iOWJkLTRlNDAtOTNmMS0wNmIzYWNkYmU3Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0b2VpYy90b2VpYy1saXN0ZW5pbmctcmVhZGluZy1zY29yZS1kZXNjcmlwdG9ycy5wZGYiLCJpYXQiOjE3NjY1NjQwOTksImV4cCI6MjA4MTkyNDA5OX0.NHH6W9W7hXoHOkSggmmJIahmedDoLC9BjZkmvLn6xIw"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline transition-colors hover:opacity-80"
                            style={{ color: '#38438f' }}
                          >
                            Listening and Reading Score Descriptors
                          </a>
                        </li>
                        <li>
                          <a 
                            href="https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/sign/toeic/toeic-speaking-writing-score-descriptors.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YzZhNjMzNi1iOWJkLTRlNDAtOTNmMS0wNmIzYWNkYmU3Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0b2VpYy90b2VpYy1zcGVha2luZy13cml0aW5nLXNjb3JlLWRlc2NyaXB0b3JzLnBkZiIsImlhdCI6MTc2NjU2NDExNiwiZXhwIjoyMDgxOTI0MTE2fQ.YnmrfpXyCYGcrYa0snS-r-a_3WyGRkmAY3eiW6mfmbU"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline transition-colors hover:opacity-80"
                            style={{ color: '#38438f' }}
                          >
                            Speaking and Writing Score Descriptors
                          </a>
                        </li>
                      </ul>
                    </div>

                    <p>
                      Each result is mapped to the European Framework of Reference for Languages (CEFR), from level A1 to C1. Here is the{' '}
                      <a 
                        href="https://ulrwcortyhassmytkcij.supabase.co/storage/v1/object/sign/toeic/TOEIC-CEFR-Mapping.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YzZhNjMzNi1iOWJkLTRlNDAtOTNmMS0wNmIzYWNkYmU3Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0b2VpYy9UT0VJQy1DRUZSLU1hcHBpbmcucGRmIiwiaWF0IjoxNzY2NTY0Mjk4LCJleHAiOjIwODE5MjQyOTh9.F1KWaIL8UscYewuBil84HWSf6CA0Xj-WBJfdm-ZE3V0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline transition-colors hover:opacity-80"
                        style={{ color: '#38438f' }}
                      >
                        CEFR Mapping Table
                      </a>.
                    </p>

                    <ul className="space-y-2 ml-4 list-disc">
                      <li>Scores are valid for 2 years.</li>
                      <li>Scores are valid worldwide.</li>
                      <li>On your digital score report, you will receive a QR code that you can share with an employer, a recruiter or an admissions officer.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

