/**
 * Differentiate A1 Adjectives (A) grand(e) for size vs height.
 *
 * - big  → grand(e) (size)
 * - tall → grand(e) (height)
 * - small / little stay petit(e) (no sense note; same meaning)
 *
 * Silver drag-and-drop still treats both grand(e) cards as interchangeable
 * via frenchSilverMatchKey() in lib/vocabulary-silver-matching.ts.
 *
 * Usage:
 *   npx tsx scripts/update-a1-adjectives-grande-sense-notes.ts
 *   npx tsx scripts/update-a1-adjectives-grande-sense-notes.ts --dry-run
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const TOPIC = 'Adjectives (A)'
const UPDATES: Record<string, string> = {
  big: 'grand(e) (size)',
  tall: 'grand(e) (height)',
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const { supabaseServer } = await import('../lib/supabase')

  for (const [wordEnglish, translationFrench] of Object.entries(UPDATES)) {
    const { data: existing, error: findError } = await supabaseServer
      .from('Brizzle_A1_vocab')
      .select('id, word_english, translation_french')
      .eq('topic_page', TOPIC)
      .eq('word_english', wordEnglish)

    if (findError) {
      throw new Error(`Failed to find "${wordEnglish}": ${findError.message}`)
    }
    if (!existing?.length) {
      throw new Error(`No A1 ${TOPIC} row found for "${wordEnglish}"`)
    }
    if (existing.length > 1) {
      throw new Error(`Multiple A1 ${TOPIC} rows found for "${wordEnglish}"`)
    }

    const row = existing[0]
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${row.word_english}: "${row.translation_french}" → "${translationFrench}"`
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
