import { formatLoggedHours } from '@/lib/course-notes-lessons'
import type { CourseHourPanel } from '@/lib/student-course-hours'

type Props = {
  panels: CourseHourPanel[]
}

type HourBlockFill = 'full' | 'half' | 'empty'

function hoursLabel(count: number): string {
  const label = formatLoggedHours(count)
  return label === '1' ? '1 hour' : `${label} hours`
}

function hourBlockFill(index: number, hoursLogged: number, totalHours: number): HourBlockFill {
  const capped = Math.min(Math.max(hoursLogged, 0), totalHours)
  const whole = Math.floor(capped + 1e-9)
  const remainder = capped - whole
  if (index < whole) return 'full'
  if (index === whole && remainder >= 0.5 - 1e-9) return 'half'
  return 'empty'
}

function CourseHourBlocks({ panel }: { panel: CourseHourPanel }) {
  const overPackage = panel.hoursLogged > panel.totalHours
  const summary = overPackage
    ? `${hoursLabel(panel.hoursLogged)} logged in a ${panel.totalHours}-hour package`
    : `${formatLoggedHours(panel.hoursLogged)} of ${panel.totalHours} hours completed`

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#38438f' }}>
        {summary}
      </h2>
      <div
        className="mt-4 grid w-full max-w-md grid-cols-10 gap-1.5"
        aria-hidden="true"
      >
        {Array.from({ length: panel.totalHours }, (_, index) => {
          const fill = hourBlockFill(index, panel.hoursLogged, panel.totalHours)
          return (
            <span
              key={index}
              className={`aspect-square rounded-sm border bg-white ${
                fill === 'empty' ? 'border-gray-300' : 'border-[#38438f]'
              }`}
              style={
                fill === 'full'
                  ? { backgroundColor: '#38438f' }
                  : fill === 'half'
                    ? { backgroundImage: 'linear-gradient(to top right, #38438f 50%, #ffffff 50%)' }
                    : undefined
              }
            />
          )
        })}
      </div>
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
      <div className="space-y-8">
        {panels.map((panel) => (
          <CourseHourBlocks key={panel.enrollmentId} panel={panel} />
        ))}
      </div>
    </section>
  )
}
