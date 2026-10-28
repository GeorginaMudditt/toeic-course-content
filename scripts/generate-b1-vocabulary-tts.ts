/**
 * Generate B1 vocabulary pronunciation audio via ElevenLabs TTS,
 * upload to Supabase Storage, and update pron_english URLs.
 *
 * One voice for every clip: George, British male, unless ELEVENLABS_VOICE_ID is set.
 *
 * Prerequisites:
 * 1. Run scripts/sql/create-b1-vocabulary-tables.sql
 * 2. Run scripts/import-b1-vocabulary.ts
 * 3. .env.local with:
 *      NEXT_PUBLIC_SUPABASE_URL
 *      SUPABASE_SERVICE_ROLE_KEY
 *      ELEVENLABS_API_KEY
 *      ELEVENLABS_VOICE_ID  (optional — defaults to George, British male)
 *
 * Usage:
 *   npx tsx scripts/generate-b1-vocabulary-tts.ts
 *   npx tsx scripts/generate-b1-vocabulary-tts.ts --dry-run
 *   npx tsx scripts/generate-b1-vocabulary-tts.ts --skip-existing
 *   npx tsx scripts/generate-b1-vocabulary-tts.ts --topic "Verbs (A)"
 */

import { config } from 'dotenv'
import { appendFileSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const DATA_FILE = join(process.cwd(), 'data', 'b1-vocabulary-topics.json')
const AUDIO_BUCKET = 'B1_audio'
/** George — British male (ElevenLabs premade voice) */
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'
/** English-only model + fixed seed keeps accent and timbre consistent across all clips */
const TTS_MODEL_ID = 'eleven_turbo_v2_5'
const TTS_LANGUAGE_CODE = 'en'
const TTS_SEED = 42

interface VocabWord {
  word_english: string
  translation_french: string
  /** Optional alternate text sent to TTS when the display spelling should not be spoken */
  tts_text?: string
}

interface VocabTopic {
  topic_page: string
  slug: string
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
  text: string,
  seed: number = TTS_SEED
): Promise<Buffer> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 5; attempt++) {
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
          seed,
          voice_settings: {
            stability: 0.85,
            similarity_boost: 0.85,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }

    const body = await response.text()
    lastError = new Error(`ElevenLabs API error ${response.status}: ${body}`)
    if (body.includes('quota_exceeded')) throw lastError
    const retryable = response.status === 429 || response.status >= 500
    if (!retryable || attempt === 5) throw lastError

    const wait = attempt * 3000
    console.warn(`  retry ${attempt} in ${wait}ms after ${response.status}`)
    await sleep(wait)
  }

  throw lastError ?? new Error('ElevenLabs request failed')
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
  const cacheOnly = process.argv.includes('--cache-only')
  const topicFilterIndex = process.argv.indexOf('--topic')
  const topicFilter =
    topicFilterIndex >= 0 ? process.argv[topicFilterIndex + 1] : null

  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID

  if (!dryRun && !apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY is missing. Add it to .env.local and try again.'
    )
  }

  console.log(`Voice: ${voiceId} (George, British male)`)
  console.log(`Model: ${TTS_MODEL_ID}, language: ${TTS_LANGUAGE_CODE}, seed: ${TTS_SEED}`)

  const data: VocabData = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  const topics = topicFilter
    ? data.topics.filter((t) => t.topic_page === topicFilter)
    : data.topics

  if (topicFilter && topics.length === 0) {
    throw new Error(`No topic found matching "${topicFilter}"`)
  }

  const total = topics.reduce((sum, t) => sum + t.words.length, 0)
  console.log(`Words: ${total}`)

  if (dryRun) {
    for (const topic of topics) {
      console.log(`  ${topic.topic_page}: ${topic.words.length}`)
    }
    console.log(`\nDry run complete — would generate ${total} audio files.`)
    return
  }

  const { supabaseServer } = await import('../lib/supabase')
  const { slugifyVocabularyText } = await import('../lib/vocabulary-levels')

  await ensurePublicBucket(supabaseServer, AUDIO_BUCKET)

  const cacheDir = join(process.cwd(), '.cache', 'b1-vocabulary-audio')
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }
  const urlLog = join(cacheDir, 'urls.jsonl')

  const { error: tableError } = await supabaseServer
    .from('Brizzle_B1_vocab')
    .select('id')
    .limit(1)
  const tableReady = !tableError
  if (!tableReady) {
    console.warn(
      'Brizzle_B1_vocab is not reachable yet. Audio will still be generated and uploaded; database links will be saved on the next run.'
    )
  }

  let generated = 0
  let skipped = 0
  let failed = 0
  let seen = 0

  for (const topic of topics) {
    console.log(`\n=== ${topic.topic_page} (${topic.words.length} words) ===`)

    for (const word of topic.words) {
      seen++
      const storagePath = `${topic.slug}/${slugifyVocabularyText(word.word_english)}.mp3`
      const cacheFile = join(cacheDir, storagePath.replace(/\//g, '__'))

      if (skipExisting && tableReady) {
        const { data: existing } = await supabaseServer
          .from('Brizzle_B1_vocab')
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
        const spokenText = word.tts_text ?? word.word_english
        const seed = word.tts_text ? TTS_SEED + spokenText.length : TTS_SEED

        let audioBuffer: Buffer
        if (cacheOnly && !existsSync(cacheFile)) {
          skipped++
          continue
        }

        if (!forceRegenerate && existsSync(cacheFile)) {
          audioBuffer = readFileSync(cacheFile)
          console.log(`  cache hit: ${word.word_english} (${seen}/${total})`)
        } else {
          console.log(
            `  generating: ${word.word_english}` +
              (spokenText !== word.word_english ? ` (spoken as "${spokenText}")` : '') +
              ` (${seen}/${total})`
          )
          audioBuffer = await generateSpeech(apiKey!, voiceId, spokenText, seed)
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

        const versionedUrl = `${urlData.publicUrl}?v=${Date.now()}`
        appendFileSync(
          urlLog,
          JSON.stringify({
            topic_page: topic.topic_page,
            word_english: word.word_english,
            pron_english: versionedUrl,
          }) + '\n'
        )

        if (tableReady) {
          const { error: updateError } = await supabaseServer
            .from('Brizzle_B1_vocab')
            .update({ pron_english: versionedUrl })
            .eq('topic_page', topic.topic_page)
            .eq('word_english', word.word_english)

          if (updateError) {
            throw new Error(updateError.message)
          }
        }

        generated++
      } catch (error: any) {
        console.error(`  FAILED: ${word.word_english} — ${error.message}`)
        failed++
      }
    }
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
