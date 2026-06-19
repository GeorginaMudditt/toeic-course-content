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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <article
          key={course.slug}
          className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 flex flex-col"
        >
          <div className="relative bg-gray-100 aspect-[3/4] border-b border-gray-200">
            <iframe
              src={`${course.pdfUrl}#page=1&view=FitH&toolbar=0&navpanes=0`}
              title={`${course.title} preview`}
              className="absolute inset-0 h-full w-full pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </div>

          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-lg font-semibold text-gray-900" style={{ color: '#38438f' }}>
              {course.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {course.hours} · {course.price}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={course.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md transition-colors hover:bg-[#2d3569]"
                style={{ backgroundColor: '#38438f' }}
              >
                View PDF
              </a>
              <button
                type="button"
                onClick={() => handleDownload(course)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border transition-colors hover:bg-gray-50"
                style={{ borderColor: '#38438f', color: '#38438f' }}
              >
                Download PDF
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
