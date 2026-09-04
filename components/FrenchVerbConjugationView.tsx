import Link from 'next/link'
import Navbar from '@/components/Navbar'
import type {
  ConjugationCell,
  ConjugationSection,
  ConjugationTheme,
  FrenchVerbPageData,
} from '@/lib/french-verb-types'

function ConjugationTable({
  forms,
  theme,
}: {
  forms: ConjugationCell[]
  theme: ConjugationTheme
}) {
  return (
    <div className={`overflow-hidden rounded-md border bg-white/80 ${theme.tableBorder}`}>
      <table className="min-w-full text-sm">
        <tbody className={`divide-y ${theme.tableDivide}`}>
          {forms.map((row) => (
            <tr key={`${row.pronoun}-${row.form}`}>
              {row.pronoun ? (
                <td className="w-32 whitespace-nowrap px-2.5 py-1.5 text-xs text-gray-500 sm:w-36">
                  {row.pronoun}
                </td>
              ) : null}
              <td className="px-2.5 py-1.5 font-semibold text-gray-900">{row.form}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TenseCard({ section }: { section: ConjugationSection }) {
  const { theme } = section

  return (
    <section className={`flex h-full flex-col rounded-xl border p-4 shadow-sm ${theme.card}`}>
      <h2 className={`mb-2 text-lg font-bold tracking-tight ${theme.title}`}>{section.title}</h2>
      <ConjugationTable forms={section.forms} theme={theme} />
      {section.note ? (
        <p className="mt-2 text-xs leading-snug text-gray-600">{section.note}</p>
      ) : null}
      <blockquote className={`mt-3 border-l-4 pl-3 ${theme.quoteBorder}`}>
        <p className="text-xs leading-relaxed text-gray-900">« {section.exampleFr} »</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{section.exampleEn}</p>
      </blockquote>
    </section>
  )
}

export default function FrenchVerbConjugationView({ verb }: { verb: FrenchVerbPageData }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/40">
      <Navbar />
      <div className="mx-auto max-w-6xl py-5 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <Link
            href="/teacher/french/verbs"
            className="mb-3 inline-block text-sm font-medium text-[#38438f] hover:underline"
          >
            ← Back to verbs
          </Link>

          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#38438f]/15 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#38438f]/70">
                Conjugaison
              </p>
              <h1 className="mt-1 text-4xl font-bold italic tracking-tight text-[#38438f]">
                {verb.infinitive}
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-gray-600">
              {verb.summary}
              {verb.radicalChips.length > 0 ? (
                <>
                  {' · '}
                  {verb.radicalChips.map((chip) => (
                    <span
                      key={chip.label}
                      className={`mr-1.5 inline-block rounded px-1.5 py-0.5 font-semibold ${chip.className}`}
                    >
                      {chip.label}
                    </span>
                  ))}
                </>
              ) : null}
            </p>
          </div>

          <div className="space-y-4">
            {verb.rows.map(([left, right]) => (
              <div
                key={`${left.title}-${right.title}`}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <TenseCard section={left} />
                <TenseCard section={right} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
