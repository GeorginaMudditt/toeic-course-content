'use client'

import type { AdultCourseDescription } from '@/lib/adult-course-descriptions'

interface Props {
  courses: AdultCourseDescription[]
}

const categoryStyles = {
  pro: {
    card: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-[#38438f]',
    title: '#38438f',
    button: '#38438f',
  },
  toeic: {
    card: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800',
    title: '#166534',
    button: '#166534',
  },
} as const

function CourseCard({
  course,
  onDownload,
}: {
  course: AdultCourseDescription
  onDownload: (course: AdultCourseDescription) => void
}) {
  const styles = course.category === 'toeic' ? categoryStyles.toeic : categoryStyles.pro
  const badgeLabel = course.category === 'toeic' ? 'TOEIC' : 'PRO'

  return (
    <article className={`shadow rounded-lg border p-4 flex flex-col ${styles.card}`}>
      <span
        className={`inline-flex self-start rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
      >
        {badgeLabel}
      </span>
      <h3 className="text-base font-semibold text-gray-900 mt-2" style={{ color: styles.title }}>
        {course.title}
      </h3>
      <p className="text-sm text-gray-600 mt-1">{course.hours}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{course.price}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={course.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors ${
            course.category === 'toeic' ? 'bg-green-800 hover:bg-green-900' : 'hover:bg-[#2d3569]'
          }`}
          style={course.category === 'pro' ? { backgroundColor: styles.button } : undefined}
        >
          View PDF
        </a>
        <button
          type="button"
          onClick={() => onDownload(course)}
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md border transition-colors hover:bg-white/60"
          style={{ borderColor: styles.button, color: styles.button }}
        >
          Download
        </button>
      </div>
    </article>
  )
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

  const proCourses = courses.filter((course) => course.category === 'pro')
  const toeicCourses = courses.filter((course) => course.category === 'toeic')

  return (
    <div className="space-y-8">
      {proCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proCourses.map((course) => (
            <CourseCard key={course.slug} course={course} onDownload={handleDownload} />
          ))}
        </div>
      )}

      {toeicCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {toeicCourses.map((course) => (
            <CourseCard key={course.slug} course={course} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  )
}
