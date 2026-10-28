/**
 * Import B1 vocabulary into Supabase.
 *
 * Icons are optional. Topics without a file in
 * public/images/vocabulary-b1/icons are imported anyway.
 *
 * Usage:
 *   npx tsx scripts/import-b1-vocabulary.ts
 *   npx tsx scripts/import-b1-vocabulary.ts --dry-run
 */

import { config } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const DATA_FILE = join(process.cwd(), 'data', 'b1-vocabulary-topics.json')
const ICONS_DIR = join(process.cwd(), 'public', 'images', 'vocabulary-b1', 'icons')
const ICONS_BUCKET = 'B1_icons'

interface VocabWord {
  word_english: string
  translation_french: string
}

interface VocabTopic {
  topic_page: string
  slug: string
  icon_file?: string
  words: VocabWord[]
}

interface VocabData {
  level: string
  topics: VocabTopic[]
}

async function ensurePublicBucket(supabase: typeof import('../lib/supabase').supabaseServer, name: string) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === name)) return

  const { error } = await supabase.storage.createBucket(name, { public: true })
  if (error) {
    throw new Error(`Failed to create bucket "${name}": ${error.message}`)
  }
  console.log(`Created public bucket: ${name}`)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const iconsOnly = process.argv.includes('--icons-only')
  const data: VocabData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  const topics = data.topics

  const vocabRows = topics.flatMap((topic) =>
    topic.words.map((word) => ({
      word_english: word.word_english,
      translation_french: word.translation_french,
      topic_page: topic.topic_page,
      pron_english: null as string | null,
    }))
  )

  console.log(`Topics: ${topics.length}`)
  console.log(`Words: ${vocabRows.length}`)

  if (dryRun) {
    for (const topic of topics) {
      console.log(`  ${topic.topic_page}: ${topic.words.length} words`)
    }
    console.log('Dry run complete — no database changes made.')
    return
  }

  const { supabaseServer } = await import('../lib/supabase')

  if (!iconsOnly) {
  const topicPages = topics.map((t) => t.topic_page)
  const { error: deleteVocabError } = await supabaseServer
    .from('Brizzle_B1_vocab')
    .delete()
    .in('topic_page', topicPages)

  if (deleteVocabError) {
    throw new Error(`Failed to clear existing vocab rows: ${deleteVocabError.message}`)
  }

  const batchSize = 300
  for (let i = 0; i < vocabRows.length; i += batchSize) {
    const batch = vocabRows.slice(i, i + batchSize)
    const { error: insertVocabError } = await supabaseServer
      .from('Brizzle_B1_vocab')
      .insert(batch)

    if (insertVocabError) {
      throw new Error(`Failed to insert vocab rows: ${insertVocabError.message}`)
    }
    console.log(`Inserted ${Math.min(i + batch.length, vocabRows.length)} / ${vocabRows.length}`)
  }
  }

  let iconsUploaded = 0
  let iconsSkipped = 0
  for (const topic of topics) {
    if (!topic.icon_file) {
      iconsSkipped++
      continue
    }
    const iconPath = join(ICONS_DIR, topic.icon_file)
    if (!existsSync(iconPath)) {
      console.log(`  icon missing, skipped: ${topic.icon_file}`)
      iconsSkipped++
      continue
    }

    if (iconsUploaded === 0) {
      await ensurePublicBucket(supabaseServer, ICONS_BUCKET)
    }

    const iconBuffer = readFileSync(iconPath)
    const storagePath = `${topic.slug}.png`
    const { error: uploadError } = await supabaseServer.storage
      .from(ICONS_BUCKET)
      .upload(storagePath, iconBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Failed to upload icon for ${topic.topic_page}: ${uploadError.message}`)
    }

    const { data: urlData } = supabaseServer.storage.from(ICONS_BUCKET).getPublicUrl(storagePath)
    const { error: iconError } = await supabaseServer
      .from('Brizzle_B1_icons')
      .upsert(
        { topic_page: topic.topic_page, icon: urlData.publicUrl },
        { onConflict: 'topic_page' }
      )

    if (iconError) {
      throw new Error(`Failed to save icon for ${topic.topic_page}: ${iconError.message}`)
    }
    iconsUploaded++
  }

  console.log(`Icons uploaded: ${iconsUploaded}, skipped: ${iconsSkipped}`)
  console.log('B1 vocabulary import complete.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
