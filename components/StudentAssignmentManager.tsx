'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatUKDate, formatCourseName as formatCourseNameUtil } from '@/lib/date-utils'
import { brizzleBlue, brizzleBlueHover, brizzleRed, brizzleRedHover } from '@/lib/brand-colors'
import { parseCourseDurationHours } from '@/lib/course-notes-lessons'
import { buildResourceStudiedLessonsMap } from '@/lib/course-notes-resource-lessons'
import { ClientLocalLastOpenedLine } from '@/components/ClientLocalDateTime'

type ProgressStatusKey = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

const ASSIGNED_SKILL_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'All', label: 'All skills' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'READING', label: 'Reading' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'TESTS', label: 'Tests' },
  { value: 'REFERENCE', label: 'Reference' },
  { value: 'TRAVEL_ENGLISH', label: 'Travel English' },
  { value: 'BUSINESS_ENGLISH', label: 'Business English' },
  { value: 'EVERYDAY_ENGLISH', label: 'Everyday English' },
]

interface Resource {
  id: string
  title: string
  type: string
  estimatedHours: number
  level?: string
  skill?: string
}

interface Course {
  id: string
  name: string
  duration: number
}

interface Assignment {
  id: string
  resource: Resource
  order: number
  progress: Array<{ status: string; updatedAt?: string | null }>
}

interface Enrollment {
  id: string
  course: Course
  assignments: Assignment[]
  enrolledAt: string | Date
  courseNoteContent?: string | null
}

interface Student {
  id: string
  name: string
  email: string
  enrollments: Enrollment[]
}

interface Props {
  student: Student
  resources: Resource[]
  courses: Course[]
}

interface PresetCourseOption {
  id: string
  name: string
  duration: number
}

const PRESET_COURSE_OPTIONS: PresetCourseOption[] = [
  { id: 'preset_toeic_progress_15', name: 'TOEIC® Pack - Progress', duration: 15 },
  { id: 'preset_toeic_perform_20', name: 'TOEIC® Pack - Perform', duration: 20 },
  { id: 'preset_pro_launch_10', name: 'PRO Pack - Launch', duration: 10 },
  { id: 'preset_pro_scale_20', name: 'PRO Pack - Scale', duration: 20 },
  { id: 'preset_pro_lead_40', name: 'PRO Pack - Lead', duration: 40 },
  { id: 'preset_travel_english', name: 'Travel English', duration: 10 },
  { id: 'preset_speak_confidence', name: 'Speak English with Confidence', duration: 10 },
  { id: 'preset_serve_sell', name: 'Serve and Sell in English', duration: 10 },
]

const OTHER_OPTION_VALUE = '__OTHER__'

function getAssignmentProgressStatus(assignment: Assignment): ProgressStatusKey {
  const progress = Array.isArray(assignment.progress) ? assignment.progress[0] : null
  const raw = progress?.status as string | undefined
  if (raw === 'IN_PROGRESS' || raw === 'COMPLETED') {
    return raw
  }
  return 'NOT_STARTED'
}

function AssignmentProgressMeta({ progress }: { progress?: { status: string; updatedAt?: string | null } }) {
  if (!progress) {
    return <p className="text-sm text-gray-400 mt-1">Not yet opened</p>
  }

  return (
    <>
      <div className="text-sm mt-1">
        Status:{' '}
        <span
          className={
            progress.status === 'COMPLETED'
              ? 'text-green-600'
              : progress.status === 'IN_PROGRESS'
                ? 'text-blue-600'
                : 'text-gray-500'
          }
        >
          {progress.status}
        </span>
      </div>
      {progress.updatedAt && <ClientLocalLastOpenedLine iso={progress.updatedAt} />}
    </>
  )
}

function StudiedLessonBadges({ lessonNumbers }: { lessonNumbers: number[] }) {
  if (lessonNumbers.length === 0) return null

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {lessonNumbers.map((num) => (
        <span
          key={num}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#e8eaf6] text-[#38438f]"
          title={`Studied in lesson ${num}`}
        >
          Lesson {num}
        </span>
      ))}
    </span>
  )
}

function getStudiedLessonsForEnrollment(enrollment: Enrollment): Map<string, number[]> {
  const refs = enrollment.assignments
    .filter((a) => a.resource?.id && a.resource?.title)
    .map((a) => ({ id: a.resource.id, title: a.resource.title }))
  return buildResourceStudiedLessonsMap(enrollment.courseNoteContent, refs)
}

export default function StudentAssignmentManager({ student, resources, courses }: Props) {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [customCourseName, setCustomCourseName] = useState('')
  const [customCourseDurationHours, setCustomCourseDurationHours] = useState('10')
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['All'])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['All'])
  const [titleSearch, setTitleSearch] = useState('')
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState<Record<string, boolean>>({})
  const [assignedListSelectedSkill, setAssignedListSelectedSkill] = useState<
    Record<string, string>
  >({})
  const [assignedListShowStatuses, setAssignedListShowStatuses] = useState<
    Record<string, Record<ProgressStatusKey, boolean>>
  >({})

  const getAssignedListSkill = (enrollmentId: string) =>
    assignedListSelectedSkill[enrollmentId] ?? 'All'

  const getAssignedListStatuses = (enrollmentId: string): Record<ProgressStatusKey, boolean> =>
    assignedListShowStatuses[enrollmentId] ?? {
      NOT_STARTED: true,
      IN_PROGRESS: true,
      COMPLETED: true,
    }

  const setAssignedListSkill = (enrollmentId: string, skill: string) => {
    setAssignedListSelectedSkill((prev) => ({ ...prev, [enrollmentId]: skill }))
  }

  const toggleAssignedListStatus = (enrollmentId: string, key: ProgressStatusKey) => {
    setAssignedListShowStatuses((prev) => {
      const current = prev[enrollmentId] ?? {
        NOT_STARTED: true,
        IN_PROGRESS: true,
        COMPLETED: true,
      }
      return {
        ...prev,
        [enrollmentId]: { ...current, [key]: !current[key] },
      }
    })
  }

  // Use the utility function directly - it handles all cleaning
  const formatCourseName = formatCourseNameUtil

  const existingCourseBySignature = new Map(
    courses.map((course) => [`${course.name.toLowerCase()}__${course.duration}`, course.id])
  )

  // Get unique levels and skills from resources
  const availableLevels = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const availableSkills = [
    'All',
    'GRAMMAR',
    'VOCABULARY',
    'READING',
    'WRITING',
    'SPEAKING',
    'LISTENING',
    'TESTS',
    'REFERENCE',
    'TRAVEL_ENGLISH',
    'BUSINESS_ENGLISH',
    'EVERYDAY_ENGLISH'
  ]

  const formatSkillLabel = (skill: string) => {
    if (skill === 'All') return 'All'
    // Convert ENUM-like values into readable labels (TRAVEL_ENGLISH -> Travel English)
    return skill
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ')
  }

  // Helper function to get assigned resource IDs for an enrollment
  const getAssignedResourceIds = (enrollment: Enrollment): string[] => {
    return enrollment.assignments.map(assignment => assignment.resource.id)
  }

  const titleSearchNormalized = titleSearch.trim().toLowerCase()

  // Filter resources based on selected filters and assigned status
  const getFilteredResources = (enrollment: Enrollment) => {
    const assignedResourceIds = getAssignedResourceIds(enrollment)
    const onlyUnassigned = showOnlyUnassigned[enrollment.id] || false
    
    return resources.filter((resource) => {
      // Title search (word or phrase in resource title)
      const titleMatch =
        !titleSearchNormalized ||
        (resource.title || '').toLowerCase().includes(titleSearchNormalized)

      // Level filter
      const levelMatch = selectedLevels.includes('All') || 
        selectedLevels.includes(resource.level || '')
      
      // Skill filter
      const skillMatch = selectedSkills.includes('All') || 
        selectedSkills.includes(resource.skill || '')
      
      // Assigned filter
      const assignedMatch = !onlyUnassigned || !assignedResourceIds.includes(resource.id)
      
      return titleMatch && levelMatch && skillMatch && assignedMatch
    })
  }

  const handleLevelToggle = (level: string) => {
    if (level === 'All') {
      setSelectedLevels(['All'])
    } else {
      setSelectedLevels((prev) => {
        const newLevels = prev.includes(level)
          ? prev.filter(l => l !== level)
          : [...prev.filter(l => l !== 'All'), level]
        return newLevels.length === 0 ? ['All'] : newLevels
      })
    }
  }

  const handleSkillToggle = (skill: string) => {
    if (skill === 'All') {
      setSelectedSkills(['All'])
    } else {
      setSelectedSkills((prev) => {
        const newSkills = prev.includes(skill)
          ? prev.filter(s => s !== skill)
          : [...prev.filter(s => s !== 'All'), skill]
        return newSkills.length === 0 ? ['All'] : newSkills
      })
    }
  }

  const getFilteredAssignedAssignments = (
    enrollmentId: string,
    assignments: Assignment[],
  ) => {
    const showStatuses = getAssignedListStatuses(enrollmentId)
    const selectedSkill = getAssignedListSkill(enrollmentId)
    const anyStatusSelected =
      showStatuses.NOT_STARTED || showStatuses.IN_PROGRESS || showStatuses.COMPLETED

    if (!anyStatusSelected) return []

    return assignments.filter((assignment) => {
      if (!showStatuses[getAssignmentProgressStatus(assignment)]) return false
      if (selectedSkill !== 'All' && assignment.resource?.skill !== selectedSkill) {
        return false
      }
      return true
    })
  }

  const getAssignedSkillOptions = (assignments: Assignment[]) => {
    const skillsInAssignments = new Set<string>()
    assignments.forEach((assignment) => {
      if (assignment.resource?.skill) skillsInAssignments.add(assignment.resource.skill)
    })
    return ASSIGNED_SKILL_FILTER_OPTIONS.filter(
      (option) => option.value === 'All' || skillsInAssignments.has(option.value),
    )
  }

  const handleEnroll = async () => {
    if (!selectedCourse) {
      alert('Please select a course')
      return
    }

    if (selectedCourse === OTHER_OPTION_VALUE && !customCourseName.trim()) {
      alert('Please enter a course name for "Other"')
      return
    }

    if (selectedCourse === OTHER_OPTION_VALUE) {
      const customDur = parseCourseDurationHours(customCourseDurationHours)
      if (customDur <= 0) {
        alert('Please enter a positive whole number of hours for the custom course package (e.g. 10).')
        return
      }
    }

    setLoading(true)
    try {
      const payload: any = { studentId: student.id }

      if (selectedCourse === OTHER_OPTION_VALUE) {
        payload.courseData = {
          name: customCourseName.trim(),
          duration: parseCourseDurationHours(customCourseDurationHours),
        }
      } else {
        const preset = PRESET_COURSE_OPTIONS.find((option) => option.id === selectedCourse)
        if (preset) {
          const signature = `${preset.name.toLowerCase()}__${preset.duration}`
          const existingCourseId = existingCourseBySignature.get(signature)
          if (existingCourseId) {
            payload.courseId = existingCourseId
          } else {
            payload.courseData = { name: preset.name, duration: preset.duration }
          }
        } else {
          payload.courseId = selectedCourse
        }
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.refresh()
        setSelectedCourse('')
        setCustomCourseName('')
        setCustomCourseDurationHours('10')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to enroll student' }))
        alert(errorData.error || 'Failed to enroll student')
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      alert('Failed to enroll student')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignResources = async (enrollmentId: string) => {
    if (selectedResources.length === 0) {
      alert('Please select at least one resource')
      return
    }

    // Find the enrollment to check for already assigned resources
    const enrollment = student.enrollments.find((e: Enrollment) => e.id === enrollmentId)
    if (enrollment) {
      const assignedResourceIds = getAssignedResourceIds(enrollment)
      const alreadyAssigned = selectedResources.filter(id => assignedResourceIds.includes(id))
      
      if (alreadyAssigned.length > 0) {
        alert(`Some selected resources are already assigned. Please uncheck them and try again.`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          resourceIds: selectedResources
        })
      })

      if (response.ok) {
        router.refresh()
        setSelectedResources([])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to assign resources' }))
        alert(errorData.error || 'Failed to assign resources')
      }
    } catch (error) {
      console.error('Error assigning resources:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign resources'
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to remove assignment')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Failed to remove assignment')
    }
  }

  return (
    <div className="space-y-6">
      {/* Enroll in Course - Only show if student has no enrollments */}
      {student.enrollments.length === 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Step 1: Enroll Student in a Course</h2>
          <p className="text-sm text-gray-600 mb-4">
            First, enroll the student in a course. Then you can assign resources to that course enrollment.
          </p>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              >
                <option value="">Select a course...</option>
                {PRESET_COURSE_OPTIONS.map((course) => (
                  <option key={course.id} value={course.id}>
                    {formatCourseName(course.name, course.duration)}
                  </option>
                ))}
                <option value={OTHER_OPTION_VALUE}>Other (custom course)</option>
              </select>

              {selectedCourse === OTHER_OPTION_VALUE && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customCourseName}
                    onChange={(e) => setCustomCourseName(e.target.value)}
                    placeholder="Enter custom course name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#38438f')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  />
                  <div>
                    <label htmlFor="custom-course-hours" className="block text-xs text-gray-600 mb-1">
                      Total package length (hours)
                    </label>
                    <input
                      id="custom-course-hours"
                      type="number"
                      min={1}
                      max={500}
                      step={1}
                      value={customCourseDurationHours}
                      onChange={(e) => setCustomCourseDurationHours(e.target.value)}
                      className="w-full max-w-[10rem] border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#38438f')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                    />
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleEnroll}
              disabled={loading || !selectedCourse || (selectedCourse === OTHER_OPTION_VALUE && !customCourseName.trim())}
              className="px-6 py-2 text-white rounded-md disabled:opacity-50 transition-colors hover:bg-[#2d3569]"
              style={{ backgroundColor: '#38438f' }}
            >
              {loading ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </div>
      )}

      {/* Current Enrollments */}
      {student.enrollments.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No course enrollments yet.</p>
            <p className="text-sm text-gray-400">Enroll the student in a course above to start assigning resources.</p>
          </div>
        </div>
      ) : (
        student.enrollments.map((enrollment) => {
          const studiedLessonsByResourceId = getStudiedLessonsForEnrollment(enrollment)

          return (
          <div key={enrollment.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold">{formatCourseName(enrollment.course.name, enrollment.course.duration)}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enrolled in <strong>{formatCourseName(enrollment.course.name, enrollment.course.duration)}</strong> on{' '}
                  {formatUKDate(enrollment.enrolledAt)}
                </p>
              </div>
            </div>

            {/* Assign Resources */}
            <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-1 text-gray-900">Assign resources to this course</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select one or more resources from your resource bank to assign to this student for this course.
              </p>
              {resources.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No resources available. Create resources in the Resource Bank first.</p>
              ) : (
                <>
                  {/* Filters */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label htmlFor={`resource-title-search-${enrollment.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        Search by title:
                      </label>
                      <div className="relative max-w-md">
                        <input
                          id={`resource-title-search-${enrollment.id}`}
                          type="search"
                          value={titleSearch}
                          onChange={(e) => setTitleSearch(e.target.value)}
                          placeholder="e.g. past simple, army, prepositions…"
                          className="w-full border border-gray-300 rounded-md pl-3 pr-9 py-2 text-sm focus:outline-none bg-white"
                          onFocus={(e) => (e.currentTarget.style.borderColor = '#38438f')}
                          onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                          autoComplete="off"
                        />
                        {titleSearch.trim() !== '' && (
                          <button
                            type="button"
                            onClick={() => setTitleSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            aria-label="Clear search"
                            title="Clear search"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Show Only Unassigned Filter */}
                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnlyUnassigned[enrollment.id] || false}
                          onChange={(e) => {
                            setShowOnlyUnassigned({
                              ...showOnlyUnassigned,
                              [enrollment.id]: e.target.checked
                            })
                          }}
                          className="cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Show only unassigned resources
                        </span>
                      </label>
                    </div>

                    {/* Level Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Level:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableLevels.map((level) => (
                          <label
                            key={level}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLevels.includes(level)}
                              onChange={() => handleLevelToggle(level)}
                              className="cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Skill Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Skill:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableSkills.map((skill) => (
                          <label
                            key={skill}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSkills.includes(skill)}
                              onChange={() => handleSkillToggle(skill)}
                              className="cursor-pointer"
                            />
                              <span className="text-sm text-gray-700">{formatSkillLabel(skill)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resource List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4 bg-white p-3 rounded border border-blue-100">
                    {getFilteredResources(enrollment).length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">
                        {showOnlyUnassigned[enrollment.id] && !titleSearchNormalized
                          ? 'All resources have been assigned to this enrollment.'
                          : titleSearchNormalized
                            ? 'No resources match your search and filters.'
                            : 'No resources match the selected filters.'}
                      </p>
                    ) : (
                      getFilteredResources(enrollment).map((resource) => {
                        const assignedResourceIds = getAssignedResourceIds(enrollment)
                        const isAssigned = assignedResourceIds.includes(resource.id)
                        const studiedLessons = studiedLessonsByResourceId.get(resource.id) ?? []
                        return (
                          <label 
                            key={resource.id} 
                            className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                              isAssigned ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-blue-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedResources.includes(resource.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedResources([...selectedResources, resource.id])
                                } else {
                                  setSelectedResources(selectedResources.filter(id => id !== resource.id))
                                }
                              }}
                              className="cursor-pointer"
                              disabled={isAssigned}
                            />
                            <span className="text-sm text-gray-700 flex-1 flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{resource.title}</span>
                              {isAssigned && studiedLessons.length > 0 && (
                                <StudiedLessonBadges lessonNumbers={studiedLessons} />
                              )}
                              {isAssigned && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Already assigned
                                </span>
                              )}
                              {(resource.level || resource.skill) && (
                                <span className="text-xs text-gray-500">
                                  {resource.level && `Level ${resource.level}`}
                                  {resource.level && resource.skill && ' • '}
                                  {resource.skill && resource.skill}
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <button
                    onClick={() => handleAssignResources(enrollment.id)}
                    disabled={loading || selectedResources.length === 0}
                    className="px-6 py-2 text-white rounded-md disabled:opacity-50 transition-colors hover:bg-[#2d3569]"
                    style={{ backgroundColor: '#38438f' }}
                  >
                    {loading ? 'Assigning...' : `Assign ${selectedResources.length > 0 ? `${selectedResources.length} ` : ''}Resource${selectedResources.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}
            </div>

            {/* Current Assignments */}
            <div>
              <div className="flex flex-col gap-4 mb-3 sm:flex-row sm:justify-between sm:items-start">
                <h3 className="font-semibold text-gray-900 shrink-0">
                  Assigned Resources ({enrollment.assignments.length})
                </h3>
                {enrollment.assignments.length > 0 && (
                  <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
                    <div className="w-full sm:w-56">
                      <label
                        htmlFor={`assigned-skill-filter-${enrollment.id}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Skill
                      </label>
                      <select
                        id={`assigned-skill-filter-${enrollment.id}`}
                        value={getAssignedListSkill(enrollment.id)}
                        onChange={(e) => setAssignedListSkill(enrollment.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none w-full text-sm bg-white"
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#38438f')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                      >
                        {getAssignedSkillOptions(enrollment.assignments).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <fieldset className="w-full sm:min-w-[280px] border border-gray-200 rounded-md p-3 bg-gray-50/50">
                      <legend className="text-sm font-medium text-gray-700 px-1">Status</legend>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-900 focus:ring-offset-0 focus:ring-[#38438f]"
                            checked={getAssignedListStatuses(enrollment.id).NOT_STARTED}
                            onChange={() => toggleAssignedListStatus(enrollment.id, 'NOT_STARTED')}
                          />
                          Not yet opened
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-900 focus:ring-offset-0 focus:ring-[#38438f]"
                            checked={getAssignedListStatuses(enrollment.id).IN_PROGRESS}
                            onChange={() => toggleAssignedListStatus(enrollment.id, 'IN_PROGRESS')}
                          />
                          In progress
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-900 focus:ring-offset-0 focus:ring-[#38438f]"
                            checked={getAssignedListStatuses(enrollment.id).COMPLETED}
                            onChange={() => toggleAssignedListStatus(enrollment.id, 'COMPLETED')}
                          />
                          Completed
                        </label>
                      </div>
                    </fieldset>
                  </div>
                )}
              </div>
              {enrollment.assignments.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">No resources assigned yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Select resources above and click "Assign Resources" to add them.</p>
                </div>
              ) : (
              <div className="space-y-2">
                {(() => {
                  const showStatuses = getAssignedListStatuses(enrollment.id)
                  const selectedSkill = getAssignedListSkill(enrollment.id)
                  const anyStatusSelected =
                    showStatuses.NOT_STARTED ||
                    showStatuses.IN_PROGRESS ||
                    showStatuses.COMPLETED
                  const hasActiveFilters =
                    selectedSkill !== 'All' ||
                    !showStatuses.NOT_STARTED ||
                    !showStatuses.IN_PROGRESS ||
                    !showStatuses.COMPLETED

                  // Separate reference and non-reference assignments
                  const referenceAssignments = enrollment.assignments.filter(
                    (assignment) => assignment.resource?.skill === 'REFERENCE'
                  )
                  const lessonAssignments = enrollment.assignments.filter(
                    (assignment) => assignment.resource?.skill !== 'REFERENCE'
                  )
                  
                  // Sort both by order
                  const sortedLessonAssignments = [...lessonAssignments].sort((a, b) => a.order - b.order)
                  const sortedReferenceAssignments = [...referenceAssignments].sort((a, b) => a.order - b.order)

                  const filteredLessonAssignments = getFilteredAssignedAssignments(
                    enrollment.id,
                    sortedLessonAssignments,
                  )
                  const filteredReferenceAssignments = getFilteredAssignedAssignments(
                    enrollment.id,
                    sortedReferenceAssignments,
                  )
                  const filteredCount =
                    filteredLessonAssignments.length + filteredReferenceAssignments.length

                  if (!anyStatusSelected) {
                    return (
                      <p className="text-sm text-gray-500">
                        Tick at least one status to see assigned resources.
                      </p>
                    )
                  }

                  if (filteredCount === 0) {
                    return (
                      <p className="text-sm text-gray-500">
                        {hasActiveFilters
                          ? 'No assigned resources match the selected status or skill filters.'
                          : 'No resources assigned yet.'}
                      </p>
                    )
                  }

                  return (
                    <>
                      {hasActiveFilters && (
                        <p className="text-sm text-gray-500 mb-1">
                          Showing {filteredCount} of {enrollment.assignments.length} resource
                          {enrollment.assignments.length === 1 ? '' : 's'}
                        </p>
                      )}
                      {/* Display lesson assignments with lesson numbers */}
                      {filteredLessonAssignments.map((assignment) => {
                        const progress = assignment.progress[0]
                        const studiedLessons =
                          studiedLessonsByResourceId.get(assignment.resource.id) ?? []
                        return (
                          <div
                            key={assignment.id}
                            className="flex justify-between items-start p-3 border rounded-lg bg-white"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 flex flex-wrap items-center gap-2">
                                <span>{assignment.resource.title}</span>
                                <StudiedLessonBadges lessonNumbers={studiedLessons} />
                              </div>
                              <AssignmentProgressMeta progress={progress} />
                            </div>
                            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                              <Link
                                href={`/student/assignment/${assignment.id}?viewAs=${student.id}`}
                                className="text-sm transition-colors"
                                style={{ color: brizzleBlue }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = brizzleBlueHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = brizzleBlue)}
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-sm transition-colors"
                                style={{ color: brizzleRed }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = brizzleRedHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = brizzleRed)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Display reference assignments without lesson numbers */}
                      {filteredReferenceAssignments.map((assignment) => {
                        const progress = assignment.progress[0]
                        const studiedLessons =
                          studiedLessonsByResourceId.get(assignment.resource.id) ?? []
                        return (
                          <div
                            key={assignment.id}
                            className="flex justify-between items-start p-3 border rounded-lg bg-white"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 flex flex-wrap items-center gap-2">
                                <span className="text-gray-500 text-sm font-normal">Reference</span>
                                <span>{assignment.resource.title}</span>
                                <StudiedLessonBadges lessonNumbers={studiedLessons} />
                              </div>
                              <AssignmentProgressMeta progress={progress} />
                            </div>
                            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                              <Link
                                href={`/student/assignment/${assignment.id}?viewAs=${student.id}`}
                                className="text-sm transition-colors"
                                style={{ color: brizzleBlue }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = brizzleBlueHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = brizzleBlue)}
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-sm transition-colors"
                                style={{ color: brizzleRed }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = brizzleRedHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = brizzleRed)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            )}
            </div>
          </div>
        )
        })
      )}
    </div>
  )
}

