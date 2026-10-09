import Link from 'next/link'
import { ENGLISH_OUTSIDE_CARD_DETAIL } from '@/lib/english-outside-class'

type Props = {
  resourcesLine: string | null
  documentLine: string
  hrefFor: (path: string) => string
}

const CARDS = [
  {
    key: 'resources',
    title: 'My Resources',
    path: '/student/course',
    ink: '#38438f',
    wash: '#f3f4f8',
    chip: '#e6e8f2',
    icon: 'resources',
  },
  {
    key: 'corrections',
    title: 'My corrections',
    path: '/student/notes',
    ink: '#3d6b64',
    wash: '#f2f6f5',
    chip: '#e2eeeb',
    icon: 'corrections',
  },
  {
    key: 'english',
    title: 'Real-World English',
    path: '/student/english-outside-class',
    ink: '#8a5a3b',
    wash: '#f8f4f0',
    chip: '#f0e6dc',
    icon: 'english',
  },
  {
    key: 'vocabulary',
    title: 'Vocabulary by CEFR level',
    path: '/student/vocabulary',
    ink: '#4f6848',
    wash: '#f3f6f2',
    chip: '#e5eee2',
    icon: 'vocabulary',
  },
  {
    key: 'writing',
    title: 'My Writing',
    path: '/student/writing',
    ink: '#5c5470',
    wash: '#f6f5f8',
    chip: '#ebe8f0',
    icon: 'writing',
  },
  {
    key: 'docs',
    title: 'My Docs',
    path: '/student/docs',
    ink: '#526270',
    wash: '#f3f5f7',
    chip: '#e5ebf0',
    icon: 'docs',
  },
  {
    key: 'toeic',
    title: 'About the TOEIC® 4-Skills Test',
    path: '/student/toeic-info',
    ink: '#6b6560',
    wash: '#f6f5f4',
    chip: '#eceae7',
    icon: 'toeic',
  },
] as const

function CardIcon({ name }: { name: (typeof CARDS)[number]['icon'] }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-5 w-5',
    'aria-hidden': true,
  }
  if (name === 'resources') {
    return (
      <svg {...common}>
        <path d="M4 7.5h5l1.5 2H20v9.5H4V7.5Z" />
        <path d="M4 10.5h16" />
      </svg>
    )
  }
  if (name === 'corrections') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.2 12.2l2.5 2.5 5.1-5.4" />
      </svg>
    )
  }
  if (name === 'english') {
    return (
      <svg {...common}>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="M10 9.2v5.6l5-2.8-5-2.8Z" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (name === 'vocabulary') {
    return (
      <svg {...common}>
        <text x="3.2" y="17" fill="currentColor" stroke="none" fontSize="13" fontFamily="Georgia, serif">
          Aa
        </text>
      </svg>
    )
  }
  if (name === 'writing') {
    return (
      <svg {...common}>
        <path d="M5 19.5h14" />
        <path d="M7 16.5l8.5-10 2.5 2.5-8.5 10H7v-2.5Z" />
      </svg>
    )
  }
  if (name === 'docs') {
    return (
      <svg {...common}>
        <path d="M7 3.5h7l4 4V20.5H7V3.5Z" />
        <path d="M14 3.5V8h4" />
        <path d="M9.5 12.5h5" />
        <path d="M9.5 16h5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8.5h7" />
      <path d="M8.5 12.5h7" />
      <path d="M8.5 16.5h4" />
    </svg>
  )
}

function CardBody({
  cardKey,
  resourcesLine,
  documentLine,
}: {
  cardKey: (typeof CARDS)[number]['key']
  resourcesLine: string | null
  documentLine: string
}) {
  if (cardKey === 'resources') {
    return (
      <>
        <p className="text-sm text-gray-600">
          {resourcesLine ? <em>{resourcesLine}</em> : 'No course enrolled yet'}
        </p>
        <p className="mt-1 text-sm text-gray-600">Find all your worksheets for lessons and homework.</p>
      </>
    )
  }
  if (cardKey === 'corrections') {
    return (
      <p className="text-sm text-gray-600">View notes, corrections from your lessons, and your attendance.</p>
    )
  }
  if (cardKey === 'english') {
    return (
      <p className="text-sm text-gray-600">{ENGLISH_OUTSIDE_CARD_DETAIL}</p>
    )
  }
  if (cardKey === 'vocabulary') {
    return <p className="text-sm text-gray-600">Test your vocabulary knowledge with these fun activities.</p>
  }
  if (cardKey === 'writing') {
    return <p className="text-sm text-gray-600">Submit writing for marking and view your teacher&apos;s corrections.</p>
  }
  if (cardKey === 'docs') {
    return (
      <div className="space-y-1 text-sm text-gray-600">
        <p>
          <em>{documentLine}</em>
        </p>
        <p>View your administrative documentation, such as your contract.</p>
      </div>
    )
  }
  return <p className="text-sm text-gray-600">Find out about test duration, format and scoring.</p>
}

export default function DashboardCardStyleSamples(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => (
        <Link
          key={card.key}
          href={props.hrefFor(card.path)}
          className="rounded-lg p-6 shadow-sm transition-shadow hover:shadow-md"
          style={{ backgroundColor: card.wash }}
        >
          <div
            className="mb-3 flex h-9 w-9 items-center justify-center rounded-md"
            style={{ backgroundColor: card.chip, color: card.ink }}
          >
            <CardIcon name={card.icon} />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{card.title}</h2>
          <CardBody cardKey={card.key} resourcesLine={props.resourcesLine} documentLine={props.documentLine} />
        </Link>
      ))}
    </div>
  )
}
