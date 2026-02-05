'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatUKDate, formatCourseName as formatCourseNameUtil } from '@/lib/date-utils'
import { brizzleRed, brizzleRedHover } from '@/lib/brand-colors'

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
  progress: Array<{ status: string }>
}

interface Enrollment {
  id: string
  course: Course
  assignments: Assignment[]
  enrolledAt: string | Date
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

export default function StudentAssignmentManager({ student, resources, courses }: Props) {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['All'])
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['All'])
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState<Record<string, boolean>>({})

  // Use the utility function directly - it handles all cleaning
  const formatCourseName = formatCourseNameUtil

  // Get unique levels and skills from resources
  const availableLevels = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const availableSkills = ['All', 'GRAMMAR', 'VOCABULARY', 'READING', 'WRITING', 'SPEAKING', 'LISTENING', 'TESTS', 'REFERENCE']

  // Helper function to get assigned resource IDs for an enrollment
  const getAssignedResourceIds = (enrollment: Enrollment): string[] => {
    return enrollment.assignments.map(assignment => assignment.resource.id)
  }

  // Filter resources based on selected filters and assigned status
  const getFilteredResources = (enrollment: Enrollment) => {
    const assignedResourceIds = getAssignedResourceIds(enrollment)
    const onlyUnassigned = showOnlyUnassigned[enrollment.id] || false
    
    return resources.filter((resource) => {
      // Level filter
      const levelMatch = selectedLevels.includes('All') || 
        selectedLevels.includes(resource.level || '')
      
      // Skill filter
      const skillMatch = selectedSkills.includes('All') || 
        selectedSkills.includes(resource.skill || '')
      
      // Assigned filter
      const assignedMatch = !onlyUnassigned || !assignedResourceIds.includes(resource.id)
      
      return levelMatch && skillMatch && assignedMatch
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

  const handleEnroll = async () => {
    if (!selectedCourse) {
      alert('Please select a course')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          courseId: selectedCourse
        })
      })

      if (response.ok) {
        router.refresh()
        setSelectedCourse('')
      } else {
        alert('Failed to enroll student')
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
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
              onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {formatCourseName(course.name, course.duration)}
                </option>
              ))}
            </select>
            <button
              onClick={handleEnroll}
              disabled={loading || !selectedCourse}
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
        student.enrollments.map((enrollment) => (
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
                            <span className="text-sm text-gray-700">{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resource List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto mb-4 bg-white p-3 rounded border border-blue-100">
                    {getFilteredResources(enrollment).length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">
                        {showOnlyUnassigned[enrollment.id] 
                          ? 'All resources have been assigned to this enrollment.' 
                          : 'No resources match the selected filters.'}
                      </p>
                    ) : (
                      getFilteredResources(enrollment).map((resource) => {
                        const assignedResourceIds = getAssignedResourceIds(enrollment)
                        const isAssigned = assignedResourceIds.includes(resource.id)
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
                            <span className="text-sm text-gray-700 flex-1 flex items-center gap-2">
                              <span className="font-medium">{resource.title}</span>
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
              <h3 className="font-semibold mb-3 text-gray-900">Assigned Resources</h3>
              {enrollment.assignments.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">No resources assigned yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Select resources above and click "Assign Resources" to add them.</p>
                </div>
              ) : (
              <div className="space-y-2">
                {enrollment.assignments.map((assignment, index) => {
                  const progress = assignment.progress[0]
                  return (
                    <div
                      key={assignment.id}
                      className="flex justify-between items-start p-3 border rounded-lg bg-white"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          Lesson {assignment.order} : {assignment.resource.title}
                        </div>
                        {progress && (
                          <div className="text-sm mt-1">
                            Status: <span className={
                              progress.status === 'COMPLETED' ? 'text-green-600' :
                              progress.status === 'IN_PROGRESS' ? 'text-blue-600' :
                              'text-gray-500'
                            }>
                              {progress.status}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        className="text-sm ml-4 flex-shrink-0 transition-colors"
                        style={{ color: brizzleRed }}
                        onMouseEnter={(e) => e.currentTarget.style.color = brizzleRedHover}
                        onMouseLeave={(e) => e.currentTarget.style.color = brizzleRed}
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

