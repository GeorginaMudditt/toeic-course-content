'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Resource {
  id: string
  title: string
  description?: string
  level: string
}

interface Props {
  resources: Resource[]
}

export default function ResourcesList({ resources }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<string>('All')

  const filteredResources = selectedLevel === 'All' 
    ? resources 
    : resources.filter(resource => resource.level === selectedLevel)

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

      <div className="mb-4">
        <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Level
        </label>
        <select
          id="level-filter"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none"
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  {resources.length === 0 
                    ? 'No resources yet. Create your first resource!'
                    : `No resources found for level ${selectedLevel}.`
                  }
                </td>
              </tr>
            ) : (
              filteredResources.map((resource) => (
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
                      className="transition-colors hover:text-[#2d3569]"
                      style={{ color: '#38438f' }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
