import { formatLoggedHours } from '@/lib/course-notes-lessons'
import type { CourseHourPanel } from '@/lib/student-course-hours'

type Props = {
  panels: CourseHourPanel[]
  hoursBooked?: number
}

type HourBlockFill = 'full' | 'half' | 'empty'

function hoursLabel(count: number): string {
  const label = formatLoggedHours(count)
  return label === '1' ? '1 hour' : `${label} hours`
}

function loggedHours(hoursLogged: number, totalHours: number): number {
  return Math.min(Math.max(hoursLogged, 0), totalHours)
}

function hourBlockFill(index: number, hoursLogged: number, totalHours: number): HourBlockFill {
  const capped = loggedHours(hoursLogged, totalHours)
  const whole = Math.floor(capped + 1e-9)
  const remainder = capped - whole
  if (index < whole) return 'full'
  if (index === whole && remainder >= 0.5 - 1e-9) return 'half'
  return 'empty'
}

function firstOpenBlockIndex(hoursLogged: number, totalHours: number): number {
  const capped = loggedHours(hoursLogged, totalHours)
  const whole = Math.floor(capped + 1e-9)
  const remainder = capped - whole
  if (whole < totalHours && remainder >= 0.5 - 1e-9) return whole + 1
  return whole
}

function bookedHoursByPanel(panels: CourseHourPanel[], hoursBooked: number): number[] {
  let remaining = Math.max(0, Math.round(hoursBooked))
  return panels.map((panel) => {
    const open = panel.totalHours - firstOpenBlockIndex(panel.hoursLogged, panel.totalHours)
    const count = Math.min(remaining, Math.max(0, open))
    remaining -= count
    return count
  })
}

function CourseHourBlocks({ panel, hoursBooked }: { panel: CourseHourPanel; hoursBooked: number }) {
  const overPackage = panel.hoursLogged > panel.totalHours
  const summary = overPackage
    ? `${hoursLabel(panel.hoursLogged)} logged in a ${panel.totalHours}-hour package`
    : `${formatLoggedHours(panel.hoursLogged)} of ${panel.totalHours} hours completed`
  const openAt = firstOpenBlockIndex(panel.hoursLogged, panel.totalHours)

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
          const booked = fill === 'empty' && index >= openAt && index < openAt + hoursBooked
          return (
            <span
              key={index}
              className={`flex aspect-square items-center justify-center rounded-sm border bg-white ${
                fill === 'empty' ? 'border-gray-300' : 'border-[#38438f]'
              }`}
              style={
                fill === 'full'
                  ? { backgroundColor: '#38438f' }
                  : fill === 'half'
                    ? { backgroundImage: 'linear-gradient(to top right, #38438f 50%, #ffffff 50%)' }
                    : undefined
              }
            >
              {booked ? <span className="text-xs leading-none opacity-40">🚀</span> : null}
            </span>
          )
        })}
      </div>
      {hoursBooked > 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          <span className="opacity-40" aria-hidden="true">
            🚀
          </span>{' '}
          = lesson booked
        </p>
      ) : null}
    </div>
  )
}

export default function CourseHoursProgress({ panels, hoursBooked = 0 }: Props) {
  if (panels.length === 0) return null
  const bookedByPanel = bookedHoursByPanel(panels, hoursBooked)

  return (
    <section
      aria-label="Course hours"
      className="rounded-lg border-t-4 bg-white p-6 shadow"
      style={{ borderTopColor: '#38438f' }}
    >
      <div className="space-y-8">
        {panels.map((panel, index) => (
          <CourseHourBlocks
            key={panel.enrollmentId}
            panel={panel}
            hoursBooked={bookedByPanel[index] ?? 0}
          />
        ))}
      </div>
    </section>
  )
}
