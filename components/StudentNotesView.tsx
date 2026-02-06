'use client'

interface Props {
  content: string
}

export default function StudentNotesView({ content }: Props) {
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
        backgroundColor: '#f9fafb',
      }}
    />
  )
}
