'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResourcePreview from '@/components/ResourcePreview'

interface Resource {
  id: string
  title: string
  description?: string
  level: string
  skill?: string
  content?: string
  type?: string
  createdAt?: string
}

interface FullResource extends Resource {
  content: string
  type: string
}

interface Props {
  resources: Resource[]
}

type SortOption = 'level' | 'alphabetical' | 'date'

export default function ResourcesList({ resources }: Props) {
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState<string>('All')
  const [selectedSkill, setSelectedSkill] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [fullResourceData, setFullResourceData] = useState<FullResource | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const levelMatch = selectedLevel === 'All' || resource.level === selectedLevel
    const skillMatch = selectedSkill === 'All' || resource.skill === selectedSkill
    return levelMatch && skillMatch
  })

  // Sort filtered resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'level': {
        // Sort by level: A1, A2, B1, B2, C1, C2
        const levelOrder: { [key: string]: number } = {
          'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
        }
        const aLevel = levelOrder[a.level] || 999
        const bLevel = levelOrder[b.level] || 999
        if (aLevel !== bLevel) {
          return aLevel - bLevel
        }
        // If same level, sort alphabetically by title
        return a.title.localeCompare(b.title)
      }
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      case 'date':
      default: {
        // Sort by date (newest first)
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bDate - aDate
      }
    }
  })

  const handleDeleteClick = async (resource: Resource) => {
    // Fetch full resource data for preview
    try {
      const response = await fetch(`/api/resources/${resource.id}`)
      if (response.ok) {
        const fullResource = await response.json()
        // Ensure content and type are present
        if (fullResource.content && fullResource.type) {
          setFullResourceData(fullResource as FullResource)
          setResourceToDelete(resource)
          setDeleteModalOpen(true)
        } else {
          alert('Resource data is incomplete. Cannot show preview.')
        }
      } else {
        alert('Failed to load resource details')
      }
    } catch (error) {
      console.error('Error fetching resource:', error)
      alert('Failed to load resource details')
    }
  }

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/resources/${resourceToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteModalOpen(false)
        setResourceToDelete(null)
        setFullResourceData(null)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete resource')
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setResourceToDelete(null)
    setFullResourceData(null)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Resource Bank</h1>
        <Link
          href="/teacher/resources/new"
          className="text-white px-4 py-2 rounded-md transition-colors hover:bg-[#2d3569]"
          style={{ backgroundColor: '#38438f' }}
        >
          + New Resource
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Level
          </label>
          <select
            id="level-filter"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none w-full"
            onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            <option value="All">All</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        <div>
          <label htmlFor="skill-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Skill
          </label>
          <select
            id="skill-filter"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none w-full"
            onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            <option value="All">All</option>
            <option value="GRAMMAR">Grammar</option>
            <option value="VOCABULARY">Vocabulary</option>
            <option value="READING">Reading</option>
            <option value="WRITING">Writing</option>
            <option value="SPEAKING">Speaking</option>
            <option value="LISTENING">Listening</option>
            <option value="TESTS">Tests</option>
            <option value="REFERENCE">Reference</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none w-full"
            onFocus={(e) => e.currentTarget.style.borderColor = '#38438f'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            <option value="date">Date Added (Newest First)</option>
            <option value="level">Level</option>
            <option value="alphabetical">Alphabetically</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skill
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedResources.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {resources.length === 0 
                    ? 'No resources yet. Create your first resource!'
                    : `No resources found for the selected filters.`
                  }
                </td>
              </tr>
            ) : (
              sortedResources.map((resource) => (
                <tr key={resource.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                    {resource.description && (
                      <div className="text-sm text-gray-500">{resource.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {resource.level || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {resource.skill ? resource.skill.charAt(0) + resource.skill.slice(1).toLowerCase() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/teacher/resources/${resource.id}/preview`}
                      className="mr-4 transition-colors hover:text-[#2d3569]"
                      style={{ color: '#38438f' }}
                    >
                      View
                    </Link>
                    <Link
                      href={`/teacher/resources/${resource.id}`}
                      className="mr-4 transition-colors hover:text-[#2d3569]"
                      style={{ color: '#38438f' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(resource)}
                      className="transition-colors"
                      style={{ color: '#ba3627' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#9a2d21'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#ba3627'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && resourceToDelete && fullResourceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Are you sure you want to delete this resource?
              </h2>
              
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {fullResourceData.title}
                  </h3>
                  {fullResourceData.description && (
                    <p className="text-sm text-gray-600 mb-2">{fullResourceData.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    <span className="mr-4">Level: {fullResourceData.level || 'N/A'}</span>
                    <span>Type: {fullResourceData.type || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Resource Preview:</h4>
                  {fullResourceData && (
                    <ResourcePreview resource={fullResourceData} showActions={false} />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-white rounded-md disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#ba3627' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#9a2d21')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#ba3627')}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
