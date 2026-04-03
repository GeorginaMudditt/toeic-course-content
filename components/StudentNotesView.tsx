'use client'

import { computePackageProgress } from '@/lib/course-notes-lessons'

interface Props {
  content: string
  /** Course duration in hours (one logged row with a date = one lesson/hour toward the package). */
  courseDurationHours?: number | null
}

type AttendanceOption = '' | 'YES_ONLINE' | 'YES_IN_PERSON' | 'NO_NOT_INFORMED'

interface LessonRow {
  date: string
  attendance: AttendanceOption
  lessonTopic: string
  corrections: string
  notes: string
}

interface NotesDataV1 {
  version: 1
  rows: LessonRow[]
}

const hasContent = (row: LessonRow) =>
  !!(row.date || row.attendance || row.lessonTopic || row.corrections || row.notes)

const formatAttendance = (value: AttendanceOption) => {
  switch (value) {
    case 'YES_ONLINE':
      return 'Yes – online'
    case 'YES_IN_PERSON':
      return 'Yes – in person'
    case 'NO_NOT_INFORMED':
      return 'No – not informed'
    default:
      return ''
  }
}

export default function StudentNotesView({ content, courseDurationHours = null }: Props) {
  // Try to parse structured notes (JSON). If it fails, fall back to rendering raw HTML.
  let structuredRows: LessonRow[] | null = null
  let fullParsed: NotesDataV1 | null = null

  if (content) {
    try {
      const parsed = JSON.parse(content) as NotesDataV1
      if (parsed && parsed.version === 1 && Array.isArray(parsed.rows)) {
        fullParsed = parsed
        structuredRows = parsed.rows.filter(hasContent)
        if (structuredRows.length === 0) {
          structuredRows = null
          fullParsed = null
        }
      }
    } catch {
      // Not JSON – treat as legacy HTML below
    }
  }

  const duration = courseDurationHours && courseDurationHours > 0 ? courseDurationHours : 0
  const progress = fullParsed ? computePackageProgress(fullParsed.rows, duration) : null
  const lessonNums = progress?.lessonNums ?? null

  if (structuredRows && fullParsed) {
    const rowsForTable = fullParsed.rows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => hasContent(row))

    return (
      <div
        className="student-notes-view"
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          color: '#000000',
          overflowX: 'auto',
        }}
      >
        {duration > 0 && progress && (
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '13px' }}>
              <strong>Hours tracking:</strong> {progress.lessonsLogged} of {duration} lesson
              {duration === 1 ? '' : 's'} logged
              {progress.lessonsRemaining !== null && progress.lessonsRemaining > 0 && (
                <>
                  {' '}
                  · {progress.lessonsRemaining} remaining in this {duration}-hour package
                </>
              )}
              {progress.lessonsRemaining === 0 &&
                progress.lessonsLogged >= duration &&
                <> · all lessons in this package are logged</>}
            </p>
            {progress.showLowLessonsWarning && progress.lessonsRemaining !== null && (
              <div
                role="status"
                style={{
                  border: '1px solid #fcd34d',
                  backgroundColor: '#fffbeb',
                  color: '#78350f',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                }}
              >
                You only have{' '}
                {progress.lessonsRemaining === 1
                  ? 'one lesson'
                  : `${progress.lessonsRemaining} lessons`}{' '}
                left in this course. Talk to your teacher if you would like to extend your package.
              </div>
            )}
            {progress.loggedOverPackage && (
              <div
                role="status"
                style={{
                  marginTop: '8px',
                  border: '1px solid #7dd3fc',
                  backgroundColor: '#f0f9ff',
                  color: '#0c4a6e',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                }}
              >
                Your teacher has logged more lessons than the hours in this package. You can discuss
                booking more hours if you are continuing.
              </div>
            )}
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Attendance</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Lesson topic</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Corrections</th>
              <th style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'left' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rowsForTable.map(({ row, idx }, index) => {
              const lessonNum = lessonNums ? lessonNums[idx] : null
              return (
              <tr key={idx} style={{ backgroundColor: index === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                  {row.date}
                  {lessonNum != null && (
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', fontWeight: 600, color: '#38438f' }}>
                      (Lesson {lessonNum})
                    </span>
                  )}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                  {formatAttendance(row.attendance)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                  {row.lessonTopic}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                  <div
                    style={{ whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: row.corrections }}
                  />
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                  <div
                    style={{ whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: row.notes }}
                  />
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Legacy free-form HTML notes
  return (
    <div
      className="student-notes-view prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        color: '#000000',
      }}
    />
  )
}
