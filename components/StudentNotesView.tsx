'use client'

interface Props {
  content: string
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

export default function StudentNotesView({ content }: Props) {
  // Try to parse structured notes (JSON). If it fails, fall back to rendering raw HTML.
  let structuredRows: LessonRow[] | null = null

  if (content) {
    try {
      const parsed = JSON.parse(content) as NotesDataV1
      if (parsed && parsed.version === 1 && Array.isArray(parsed.rows)) {
        structuredRows = parsed.rows.filter(hasContent)
        if (structuredRows.length === 0) {
          structuredRows = null
        }
      }
    } catch {
      // Not JSON – treat as legacy HTML below
    }
  }

  if (structuredRows) {
    return (
      <div
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
            {structuredRows.map((row, index) => (
              <tr key={index} style={{ backgroundColor: index === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', verticalAlign: 'top' }}>
                  {row.date}
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
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Legacy free-form HTML notes
  return (
    <div
      className="prose max-w-none"
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
