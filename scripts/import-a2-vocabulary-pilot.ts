/**
 * Import A2 vocabulary pilot data into Supabase.
 *
 * Prerequisites:
 * 1. Run scripts/sql/create-a2-vocabulary-tables.sql in Supabase SQL Editor
 * 2. .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/import-a2-vocabulary-pilot.ts
 *   npx tsx scripts/import-a2-vocabulary-pilot.ts --dry-run
 *   npx tsx scripts/import-a2-vocabulary-pilot.ts --topics "Animals,Arts"
 */

import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const DATA_FILE = join(process.cwd(), 'data', 'a2-vocabulary-pilot.json')
const ICONS_DIR = join(process.cwd(), 'public', 'images', 'vocabulary-a2', 'icons')
const ICONS_BUCKET = 'A2_icons'

interface VocabWord {
  word_english: string
  translation_french: string
}

interface VocabTopic {
  topic_page: string
  slug: string
  icon_file: string
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
  const topicsArgIndex = process.argv.indexOf('--topics')
  const topicsFilter =
    topicsArgIndex >= 0
      ? process.argv[topicsArgIndex + 1]
          ?.split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : null

  const data: VocabData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  const topics = topicsFilter?.length
    ? data.topics.filter((t) => topicsFilter.includes(t.topic_page))
    : data.topics

  if (topicsFilter?.length && topics.length === 0) {
    throw new Error(`No topics matched --topics filter: ${topicsFilter.join(', ')}`)
  }

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
  const { slugifyVocabularyText } = await import('../lib/vocabulary-levels')

  await ensurePublicBucket(supabaseServer, ICONS_BUCKET)

  const topicPages = topics.map((t) => t.topic_page)
  const { error: deleteVocabError } = await supabaseServer
    .from('Brizzle_A2_vocab')
    .delete()
    .in('topic_page', topicPages)

  if (deleteVocabError) {
    throw new Error(`Failed to clear existing vocab rows: ${deleteVocabError.message}`)
  }

  const { error: insertVocabError } = await supabaseServer
    .from('Brizzle_A2_vocab')
    .insert(vocabRows)

  if (insertVocabError) {
    throw new Error(`Failed to insert vocab rows: ${insertVocabError.message}`)
  }

  console.log(`Inserted ${vocabRows.length} vocabulary rows.`)

  for (const topic of topics) {
    const iconPath = join(ICONS_DIR, topic.icon_file)
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

    const { data: iconUrlData } = supabaseServer.storage
      .from(ICONS_BUCKET)
      .getPublicUrl(storagePath)

    const { error: iconUpsertError } = await supabaseServer
      .from('Brizzle_A2_icons')
      .upsert(
        {
          topic_page: topic.topic_page,
          icon: iconUrlData.publicUrl,
        },
        { onConflict: 'topic_page' }
      )

    if (iconUpsertError) {
      throw new Error(`Failed to upsert icon row for ${topic.topic_page}: ${iconUpsertError.message}`)
    }

    console.log(`Uploaded icon: ${topic.topic_page} → ${iconUrlData.publicUrl}`)
  }

  console.log('\nNext step — generate audio:')
  console.log('  npx tsx scripts/generate-a2-vocabulary-tts.ts')
  console.log('\nAudio paths will follow:')
  for (const topic of topics.slice(0, 1)) {
    const sample = topic.words[0]
    console.log(`  ${topic.slug}/${slugifyVocabularyText(sample.word_english)}.mp3`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
