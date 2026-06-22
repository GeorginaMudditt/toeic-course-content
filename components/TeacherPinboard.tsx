'use client'

type PhotoLayout = {
  top?: string
  bottom?: string
  left?: string
  right?: string
  rotate: number
  width: number
}

const QUOTE =
  "No one on their deathbed ever said, ‘I wish I had spent more time at the office.’"

// Perimeter frame — each slot is spaced so photos don't overlap each other or the quote.
const PHOTO_LAYOUTS: PhotoLayout[] = [
  // Left column
  { top: '3%', left: '1.5%', rotate: -6, width: 190 },
  { top: '32%', left: '2%', rotate: 5, width: 190 },
  { top: '61%', left: '1.5%', rotate: -5, width: 190 },
  // Right column
  { top: '3%', right: '1.5%', rotate: 6, width: 190 },
  { top: '32%', right: '2%', rotate: -5, width: 190 },
  { top: '61%', right: '1.5%', rotate: 7, width: 190 },
  // Top row (above quote)
  { top: '2%', left: '21%', rotate: -4, width: 165 },
  { top: '2%', left: '41%', rotate: 3, width: 165 },
  { top: '2%', left: '61%', rotate: 5, width: 165 },
  // Bottom row (below quote)
  { bottom: '2%', left: '21%', rotate: 4, width: 165 },
  { bottom: '2%', left: '41%', rotate: -3, width: 165 },
  { bottom: '2%', left: '61%', rotate: 5, width: 165 },
]

function PinPhoto({ src, layout }: { src: string; layout: PhotoLayout }) {
  const photoWidth = `clamp(120px, ${(layout.width / 7).toFixed(1)}vw, ${layout.width}px)`

  return (
    <div
      className="absolute transition-transform duration-300 hover:scale-[1.02]"
      style={{
        top: layout.top,
        bottom: layout.bottom,
        left: layout.left,
        right: layout.right,
        transform: `rotate(${layout.rotate}deg)`,
        width: photoWidth,
      }}
    >
      <div className="relative bg-white px-2.5 pt-2.5 pb-7 shadow-[2px_4px_14px_rgba(0,0,0,0.22)]">
        <div
          className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full shadow-sm"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
          }}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="block h-auto w-full bg-stone-100 object-contain"
          style={{ aspectRatio: '4 / 5' }}
          loading="lazy"
        />
      </div>
    </div>
  )
}

export default function TeacherPinboard({ photos }: { photos: string[] }) {
  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4"
      style={{
        backgroundColor: '#c9a66b',
        backgroundImage: `
          radial-gradient(ellipse at 15% 20%, rgba(255,255,255,0.12) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 75%, rgba(0,0,0,0.08) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(139,90,43,0.15) 0%, transparent 70%),
          repeating-linear-gradient(
            92deg,
            transparent,
            transparent 3px,
            rgba(0,0,0,0.03) 3px,
            rgba(0,0,0,0.03) 4px
          ),
          repeating-linear-gradient(
            -4deg,
            transparent,
            transparent 5px,
            rgba(255,255,255,0.04) 5px,
            rgba(255,255,255,0.04) 6px
          )
        `,
      }}
    >
      {photos.map((src, index) => (
        <PinPhoto key={src} src={src} layout={PHOTO_LAYOUTS[index % PHOTO_LAYOUTS.length]} />
      ))}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 py-20 sm:py-24">
        <figure className="max-w-sm rotate-[-1deg] rounded-sm border border-amber-100/80 bg-[#faf6ee]/95 px-7 py-9 text-center shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-[2px] sm:max-w-md sm:px-10 sm:py-10">
          <div
            className="mx-auto mb-4 h-1 w-16 rounded-full opacity-40"
            style={{ backgroundColor: '#38438f' }}
            aria-hidden="true"
          />
          <blockquote
            className="font-serif text-lg leading-relaxed text-stone-700 sm:text-xl sm:leading-relaxed"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {QUOTE}
          </blockquote>
        </figure>
      </div>
    </div>
  )
}
