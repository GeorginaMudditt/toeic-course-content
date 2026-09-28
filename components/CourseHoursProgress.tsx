import type { CourseHourPanel } from '@/lib/student-course-hours'

type Props = {
  panels: CourseHourPanel[]
}

function hoursLabel(count: number): string {
  return count === 1 ? '1 hour' : `${count} hours`
}

function CourseHourBlocks({ panel }: { panel: CourseHourPanel }) {
  const filled = Math.min(panel.hoursLogged, panel.totalHours)
  const overPackage = panel.hoursLogged > panel.totalHours
  const summary = overPackage
    ? `${hoursLabel(panel.hoursLogged)} logged in a ${panel.totalHours}-hour package`
    : `${panel.hoursLogged} of ${panel.totalHours} hours completed`

  return (
    <div>
      <p className="text-sm text-gray-600">{panel.courseLabel}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{summary}</p>
      <div
        className="mt-4 grid w-full max-w-md grid-cols-10 gap-1.5"
        aria-hidden="true"
      >
        {Array.from({ length: panel.totalHours }, (_, index) => {
          const complete = index < filled
          return (
            <span
              key={index}
              className={`aspect-square rounded-sm border ${
                complete ? 'border-[#38438f] bg-[#38438f]' : 'border-gray-300 bg-white'
              }`}
            />
          )
        })}
      </div>
      <p className="mt-3 text-sm text-gray-500">
        Each block is one hour logged in My Notes.
        {overPackage ? ' Every block in this package is filled.' : ''}
      </p>
    </div>
  )
}

export default function CourseHoursProgress({ panels }: Props) {
  if (panels.length === 0) return null

  return (
    <section
      aria-label="Course hours"
      className="rounded-lg border-t-4 bg-white p-6 shadow"
      style={{ borderTopColor: '#38438f' }}
    >
      <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#38438f' }}>
        Course hours
      </h2>
      <div className="mt-5 space-y-8">
        {panels.map((panel) => (
          <CourseHourBlocks key={panel.enrollmentId} panel={panel} />
        ))}
      </div>
    </section>
  )
}
