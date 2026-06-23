/**
 * Generate A2 vocabulary pronunciation audio via ElevenLabs TTS,
 * upload to Supabase Storage, and update pron_english URLs.
 *
 * Prerequisites:
 * 1. Run scripts/import-a2-vocabulary-pilot.ts first
 * 2. .env.local with:
 *      NEXT_PUBLIC_SUPABASE_URL
 *      SUPABASE_SERVICE_ROLE_KEY
 *      ELEVENLABS_API_KEY
 *      ELEVENLABS_VOICE_ID  (optional — defaults to George, British male)
 *
 * Usage:
 *   npx tsx scripts/generate-a2-vocabulary-tts.ts
 *   npx tsx scripts/generate-a2-vocabulary-tts.ts --topic "Activities (A)"
 *   npx tsx scripts/generate-a2-vocabulary-tts.ts --dry-run
 *   npx tsx scripts/generate-a2-vocabulary-tts.ts --skip-existing
 *   npx tsx scripts/generate-a2-vocabulary-tts.ts --force
 */

import { config } from 'dotenv'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const DATA_FILE = join(process.cwd(), 'data', 'a2-vocabulary-pilot.json')
const AUDIO_BUCKET = 'A2_audio'
/** George — British male (ElevenLabs premade voice) */
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'
/** English-only model + fixed seed keeps accent and timbre consistent across all clips */
const TTS_MODEL_ID = 'eleven_turbo_v2_5'
const TTS_LANGUAGE_CODE = 'en'
const TTS_SEED = 42

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateSpeech(
  apiKey: string,
  voiceId: string,
  text: string
): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL_ID,
        language_code: TTS_LANGUAGE_CODE,
        seed: TTS_SEED,
        voice_settings: {
          stability: 0.85,
          similarity_boost: 0.85,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ElevenLabs API error ${response.status}: ${body}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
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
  const skipExisting = process.argv.includes('--skip-existing')
  const forceRegenerate = process.argv.includes('--force')
  const topicFilterIndex = process.argv.indexOf('--topic')
  const topicFilter =
    topicFilterIndex >= 0 ? process.argv[topicFilterIndex + 1] : null
  const topicsArgIndex = process.argv.indexOf('--topics')
  const topicsFilter =
    topicsArgIndex >= 0
      ? process.argv[topicsArgIndex + 1]
          ?.split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : null

  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID

  if (!dryRun && !apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY is missing. Add it to .env.local and try again.'
    )
  }

  console.log(`Voice: ${voiceId} (George, British male)`)
  console.log(`Model: ${TTS_MODEL_ID}, language: ${TTS_LANGUAGE_CODE}, seed: ${TTS_SEED}`)
  if (forceRegenerate) {
    console.log('Force mode: regenerating all audio from ElevenLabs (ignoring cache)')
  }

  const data: VocabData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  const topics = topicsFilter?.length
    ? data.topics.filter((t) => topicsFilter.includes(t.topic_page))
    : topicFilter
      ? data.topics.filter((t) => t.topic_page === topicFilter)
      : data.topics

  if (topicsFilter?.length && topics.length === 0) {
    throw new Error(`No topics matched --topics filter: ${topicsFilter.join(', ')}`)
  }

  if (topicFilter && topics.length === 0) {
    throw new Error(`No topic found matching "${topicFilter}"`)
  }

  const { supabaseServer } = await import('../lib/supabase')
  const { slugifyVocabularyText } = await import('../lib/vocabulary-levels')

  await ensurePublicBucket(supabaseServer, AUDIO_BUCKET)

  const cacheDir = join(process.cwd(), '.cache', 'a2-vocabulary-audio')
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const topic of topics) {
    console.log(`\n=== ${topic.topic_page} (${topic.words.length} words) ===`)

    for (const word of topic.words) {
      const storagePath = `${topic.slug}/${slugifyVocabularyText(word.word_english)}.mp3`
      const cacheFile = join(cacheDir, storagePath.replace(/\//g, '__'))

      if (dryRun) {
        console.log(`  [dry-run] ${word.word_english} → ${storagePath}`)
        continue
      }

      if (skipExisting) {
        const { data: existing } = await supabaseServer
          .from('Brizzle_A2_vocab')
          .select('pron_english')
          .eq('topic_page', topic.topic_page)
          .eq('word_english', word.word_english)
          .maybeSingle()

        if (existing?.pron_english) {
          console.log(`  skip (exists): ${word.word_english}`)
          skipped++
          continue
        }
      }

      try {
        let audioBuffer: Buffer
        if (!forceRegenerate && existsSync(cacheFile)) {
          audioBuffer = readFileSync(cacheFile)
          console.log(`  cache hit: ${word.word_english}`)
        } else {
          console.log(`  generating: ${word.word_english}`)
          audioBuffer = await generateSpeech(apiKey!, voiceId, word.word_english)
          writeFileSync(cacheFile, audioBuffer)
          await sleep(300)
        }

        const { error: uploadError } = await supabaseServer.storage
          .from(AUDIO_BUCKET)
          .upload(storagePath, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data: urlData } = supabaseServer.storage
          .from(AUDIO_BUCKET)
          .getPublicUrl(storagePath)

        const { error: updateError } = await supabaseServer
          .from('Brizzle_A2_vocab')
          .update({ pron_english: urlData.publicUrl })
          .eq('topic_page', topic.topic_page)
          .eq('word_english', word.word_english)

        if (updateError) {
          throw new Error(updateError.message)
        }

        generated++
      } catch (error: any) {
        console.error(`  FAILED: ${word.word_english} — ${error.message}`)
        failed++
      }
    }
  }

  if (dryRun) {
    const total = topics.reduce((sum, t) => sum + t.words.length, 0)
    console.log(`\nDry run complete — would generate ${total} audio files.`)
    return
  }

  console.log(`\nDone. Generated: ${generated}, skipped: ${skipped}, failed: ${failed}`)
  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
