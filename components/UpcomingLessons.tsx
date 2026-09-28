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
  return (
    <section
      aria-label="Upcoming lessons"
      className="rounded-lg border-t-4 bg-white p-6 shadow"
      style={{ borderTopColor: '#38438f' }}
    >
      <h2 className="text-xl font-semibold text-gray-900" style={{ color: '#38438f' }}>
        Upcoming lessons
      </h2>
      {lessons.length === 0 ? (
        <p className="mt-5 text-gray-600">No upcoming lessons</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <p className="text-lg font-semibold text-gray-900">{formatLessonDate(lesson.lessonDate)}</p>
              <LessonDetails lesson={lesson} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
