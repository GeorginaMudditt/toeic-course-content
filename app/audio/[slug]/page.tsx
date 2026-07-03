import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import MarketingAudioPlayer from '@/components/MarketingAudioPlayer'

export default async function PublicMarketingAudioPage({
  params,
}: {
  params: { slug: string }
}) {
  const slug = decodeURIComponent(params.slug).trim().toLowerCase()

  const { data, error } = await supabaseServer
    .from('Brizzle_marketing_pronunciation')
    .select('topic, slug, supabase_url')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error loading marketing pronunciation page:', error)
    notFound()
  }

  if (!data) {
    notFound()
  }

  const displayWord = data.topic?.trim() || data.slug.replace(/-/g, ' ')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-6 flex justify-center">
          <img src="/brizzle-logo.png" alt="Brizzle" width={56} height={56} className="h-14 w-14" />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-[#38438f] mb-2">
          Brizzle pronunciation
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">{displayWord}</h1>
        <p className="text-sm text-gray-600 mb-8">Tap play to hear the English pronunciation.</p>
        <MarketingAudioPlayer audioUrl={data.supabase_url} label={displayWord} />
        <p className="mt-8 text-xs text-gray-400">
          <a href="https://www.brizzle-english.com" className="hover:text-[#38438f] hover:underline">
            brizzle-english.com
          </a>
        </p>
      </div>
    </div>
  )
}
