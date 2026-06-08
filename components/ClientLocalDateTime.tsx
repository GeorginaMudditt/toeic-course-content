'use client'

import { useEffect, useState } from 'react'

/** PostgREST / Postgres sometimes returns a space instead of "T" in ISO strings. */
function parseDbTimestamp(iso: string | null | undefined): Date | null {
  if (iso == null) return null
  let s = String(iso).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) {
    s = s.replace(' ', 'T')
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

const PRESETS = {
  datetimeShort: {
    day: 'numeric' as const,
    month: 'short' as const,
    year: 'numeric' as const,
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
}

type Preset = keyof typeof PRESETS

type Props = {
  iso: string | null | undefined
  preset: Preset
  /** Shown until the browser has mounted (avoids SSR showing UTC). */
  placeholder?: string
  className?: string
}

/**
 * Renders a timestamp in the viewer’s browser timezone.
 * Next.js SSR runs in UTC; we only format after mount so teachers see local wall time.
 */
export function ClientLocalDateTime({ iso, preset, placeholder = '…', className }: Props) {
  const [text, setText] = useState(placeholder)

  useEffect(() => {
    const d = parseDbTimestamp(iso)
    if (!d) {
      setText(placeholder)
      return
    }
    setText(d.toLocaleString(undefined, PRESETS[preset]))
  }, [iso, preset, placeholder])

  return <span className={className}>{text}</span>
}

/** One line: “Last seen at HH:mm on …” in the user’s locale and timezone. */
export function ClientLocalLastSeenLine({
  iso,
  prefix = 'Last seen at',
  className = 'text-sm text-gray-500 mt-1',
}: {
  iso: string | null | undefined
  prefix?: string
  className?: string
}) {
  const [line, setLine] = useState(`${prefix} …`)

  useEffect(() => {
    const d = parseDbTimestamp(iso)
    if (!d) {
      setLine(`${prefix} …`)
      return
    }
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    const date = d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    setLine(`${prefix} ${time} on ${date}`)
  }, [iso, prefix])

  return <p className={className}>{line}</p>
}

/** One line: “Last opened at HH:mm on …” in the user’s locale and timezone. */
export function ClientLocalLastOpenedLine({
  iso,
  className = 'text-sm text-gray-500 mt-1',
}: {
  iso: string | null | undefined
  className?: string
}) {
  return <ClientLocalLastSeenLine iso={iso} prefix="Last opened at" className={className} />
}
