/**
 * Add French sense notes on A1 Verbs (A) where one French verb covers two English verbs.
 *
 * - to teach → apprendre (à quelqu'un)
 * - to look  → regarder (une photo)
 * - to watch → regarder (un film)
 * - commencer (to begin / to start) stays unmarked: same meaning
 *
 * Silver drag-and-drop still treats each pair as interchangeable via
 * frenchSilverMatchKey() in lib/vocabulary-silver-matching.ts.
 * Gold matches the full French text, so each card has its own answer.
 *
 * Usage:
 *   npx tsx scripts/update-a1-verbs-a-sense-notes.ts
 *   npx tsx scripts/update-a1-verbs-a-sense-notes.ts --dry-run
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const TOPIC = 'Verbs (A)'
const UPDATES: Record<string, string> = {
  'to teach': 'apprendre (à quelqu\'un)',
  'to look': 'regarder (une photo)',
  'to watch': 'regarder (un film)',
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const { supabaseServer } = await import('../lib/supabase')

  const { data: rows, error: findError } = await supabaseServer
    .from('Brizzle_A1_vocab')
    .select('id, word_english, translation_french')
    .eq('topic_page', TOPIC)

  if (findError) {
    throw new Error(`Failed to load A1 ${TOPIC}: ${findError.message}`)
  }

  for (const [wordEnglish, translationFrench] of Object.entries(UPDATES)) {
    const matches = (rows || []).filter((row) => row.word_english.trim() === wordEnglish)
    if (!matches.length) {
      throw new Error(`No A1 ${TOPIC} row found for "${wordEnglish}"`)
    }
    if (matches.length > 1) {
      throw new Error(`Multiple A1 ${TOPIC} rows found for "${wordEnglish}"`)
    }

    const row = matches[0]
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${row.word_english.trim()}: "${row.translation_french}" → "${translationFrench}"`
    )

    if (dryRun) continue

    const { error: updateError } = await supabaseServer
      .from('Brizzle_A1_vocab')
      .update({ translation_french: translationFrench })
      .eq('id', row.id)

    if (updateError) {
      throw new Error(`Failed to update "${wordEnglish}": ${updateError.message}`)
    }
  }

  console.log(dryRun ? 'Dry run complete.' : 'Updates complete.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
