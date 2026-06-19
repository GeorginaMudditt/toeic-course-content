'use client'

import type { AdultCourseDescription } from '@/lib/adult-course-descriptions'

interface Props {
  courses: AdultCourseDescription[]
}

export default function QualiopiCourseDescriptions({ courses }: Props) {
  const handleDownload = (course: AdultCourseDescription) => {
    const link = document.createElement('a')
    link.href = course.pdfUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.download = `${course.slug}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
        <p>No course descriptions are available yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((course) => (
        <article
          key={course.slug}
          className="bg-white shadow rounded-lg border border-gray-100 p-4 flex flex-col"
        >
          <h3 className="text-base font-semibold text-gray-900" style={{ color: '#38438f' }}>
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{course.hours}</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{course.price}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={course.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors hover:bg-[#2d3569]"
              style={{ backgroundColor: '#38438f' }}
            >
              View PDF
            </a>
            <button
              type="button"
              onClick={() => handleDownload(course)}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#38438f', color: '#38438f' }}
            >
              Download
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
