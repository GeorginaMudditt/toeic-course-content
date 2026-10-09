'use client'

import {
  ENGLISH_OUTSIDE_CONTENT_NOTES,
  ENGLISH_OUTSIDE_FORMATS,
  ENGLISH_OUTSIDE_LEVELS,
  ENGLISH_OUTSIDE_TOPICS,
  labelFor,
  realWorldEnglishImageSrc,
} from '@/lib/english-outside-class'

const TONE_CLASS = {
  format: 'bg-[#e8eaf6] text-[#38438f]',
  topic: 'bg-gray-100 text-gray-700',
  note: 'bg-amber-100 text-amber-950',
  level: 'bg-emerald-50 text-emerald-900',
} as const

export function OutsidePill({
  tone,
  children,
}: {
  tone: keyof typeof TONE_CLASS
  children: React.ReactNode
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  )
}

export function ResourceThumbnail({ filename }: { filename: string | null }) {
  const src = realWorldEnglishImageSrc(filename)
  return (
    <div className="relative aspect-[297/210] w-full shrink-0 self-start overflow-hidden rounded-lg bg-[#e8eaf6] sm:w-64">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs font-medium text-[#38438f]">
          Picture
        </div>
      )}
    </div>
  )
}

export function ResourceTags({
  formats,
  level,
  topicTags,
  contentNotes,
}: {
  formats: string[]
  level: string | null
  topicTags: string[]
  contentNotes: string[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {formats.map((format) => (
        <OutsidePill key={format} tone="format">
          {labelFor(ENGLISH_OUTSIDE_FORMATS, format)}
        </OutsidePill>
      ))}
      {level && (
        <OutsidePill tone="level">{labelFor(ENGLISH_OUTSIDE_LEVELS, level)}</OutsidePill>
      )}
      {topicTags.map((tag) => (
        <OutsidePill key={tag} tone="topic">
          {labelFor(ENGLISH_OUTSIDE_TOPICS, tag)}
        </OutsidePill>
      ))}
      {contentNotes.map((tag) => (
        <OutsidePill key={tag} tone="note">
          {labelFor(ENGLISH_OUTSIDE_CONTENT_NOTES, tag)}
        </OutsidePill>
      ))}
    </div>
  )
}

export function StarRow({
  value,
  onChange,
  disabled,
  label = 'Rating',
}: {
  value: number
  onChange?: (stars: number) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <div className="inline-flex items-center gap-0.5" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        const className = `text-lg leading-none ${
          filled ? 'text-amber-500' : 'text-gray-300'
        } ${onChange && !disabled ? 'hover:text-amber-500' : ''}`
        if (!onChange) {
          return (
            <span key={star} className={className} aria-hidden="true">
              ★
            </span>
          )
        }
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`${className} disabled:opacity-50`}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

export function TagSelect({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string
  options: readonly { id: string; label: string }[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                active
                  ? 'bg-[#38438f] text-white border-[#38438f]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#38438f]'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export const fieldClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38438f]'
