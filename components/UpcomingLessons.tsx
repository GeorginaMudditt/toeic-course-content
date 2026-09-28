import {
  formatLessonDate,
  formatLessonLength,
  formatLessonType,
  type UpcomingLesson,
} from '@/lib/booked-lessons'

type Props = {
  lessons: UpcomingLesson[]
}

function LessonDetails({ lesson }: { lesson: UpcomingLesson }) {
  const details = [
    `${lesson.startTime}–${lesson.endTime}`,
    formatLessonLength(lesson.startTime, lesson.endTime),
    formatLessonType(lesson.lessonType),
  ].filter(Boolean)

  return <p className="mt-1 text-sm text-gray-600">{details.join(' · ')}</p>
}

export default function UpcomingLessons({ lessons }: Props) {
  const [next, ...later] = lessons

  return (
    <section
      aria-label="Lessons booked"
      className="rounded-lg border-t-4 bg-white p-6 shadow"
      style={{ borderTopColor: '#38438f' }}
    >
      <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#38438f' }}>
        Lessons booked
      </h2>
      {!next ? (
        <p className="mt-5 text-gray-600">No lessons booked yet.</p>
      ) : (
        <div className="mt-5">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Next lesson</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{formatLessonDate(next.lessonDate)}</p>
          <LessonDetails lesson={next} />
          {later.length > 0 && (
            <ul className="mt-6 space-y-4 border-t border-gray-100 pt-5">
              {later.map((lesson) => (
                <li key={lesson.id}>
                  <p className="font-medium text-gray-900">{formatLessonDate(lesson.lessonDate)}</p>
                  <LessonDetails lesson={lesson} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
