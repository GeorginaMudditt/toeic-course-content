/**
 * Verify what Placement Test content is actually stored in Supabase.
 * Run from project root: npx tsx scripts/verify-placement-test-in-db.ts
 * Uses the same env as the app (.env.local / .env).
 */
import { config } from 'dotenv'
import { resolve } from 'path'

const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')
config({ path: envLocalPath })
config({ path: envPath })

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '(not set)'
  console.log('Using Supabase URL:', supabaseUrl.replace(/https:\/\/[^.]+\./, 'https://***.'))
  console.log('')

  const { data: resources, error } = await supabaseServer
    .from('Resource')
    .select('id, title, content')
    .ilike('title', '%Placement Test%')

  if (error) {
    console.error('Error fetching resource:', error.message)
    process.exit(1)
  }

  if (!resources || resources.length === 0) {
    console.log('No Placement Test resource found in database.')
    process.exit(0)
  }

  const r = resources[0]
  const content = (r.content || '') as string
  const len = content.length

  const checks = [
    { name: 'Answers section heading', pattern: '📝 Answers' },
    { name: 'Listening answers (Photograph 1: C)', pattern: 'Photograph 1: <strong>C</strong>' },
    { name: 'Reading answers (Incomplete Sentences)', pattern: 'Incomplete Sentences: <strong>' },
    { name: 'Audio Transcripts heading', pattern: 'Audio Transcripts' },
    { name: 'Conversation 1 transcript table', pattern: 'Aisha' },
  ]

  console.log('Placement Test in database:')
  console.log('  ID:', r.id)
  console.log('  Title:', r.title)
  console.log('  Content length:', len, 'characters')
  console.log('')
  console.log('Content checks:')
  for (const { name, pattern } of checks) {
    const found = content.includes(pattern)
    console.log('  ', found ? '✓' : '✗', name)
  }
  console.log('')

  if (len < 20000) {
    console.log('⚠️  Content length is short; full answers/transcripts may be missing.')
    console.log('   Run: npx tsx scripts/update-resource-supabase.ts "Placement Test" "placement-test-html.html"')
  } else {
    console.log('✓ Content length looks complete. If the app still shows missing answers,')
    console.log('  ensure you are viewing the same environment (localhost vs deployed) and')
    console.log('  that the deployed app uses the same Supabase URL as above.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
