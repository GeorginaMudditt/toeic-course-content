/**
 * Generate Customer Service worksheet pronunciation audio via ElevenLabs TTS.
 * Saves to public/vocab-audio/customer-service-vocab-audio/{word}.mp3
 *
 * Prerequisites: ELEVENLABS_API_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/generate-customer-service-vocab-tts.ts
 *   npx tsx scripts/generate-customer-service-vocab-tts.ts --dry-run
 *   npx tsx scripts/generate-customer-service-vocab-tts.ts --skip-existing
 *   npx tsx scripts/generate-customer-service-vocab-tts.ts --force
 *   npx tsx scripts/generate-customer-service-vocab-tts.ts --words "customer,complaint"
 */

import { config } from 'dotenv'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

/** Alice — Clear, Engaging Educator (ElevenLabs premade voice) */
const ALICE_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'
const TTS_MODEL_ID = 'eleven_turbo_v2_5'
const TTS_LANGUAGE_CODE = 'en'
const TTS_SEED = 42

const OUTPUT_DIR = join(process.cwd(), 'public', 'vocab-audio', 'customer-service-vocab-audio')
const CACHE_DIR = join(process.cwd(), '.cache', 'customer-service-vocab-audio')

const WORDS: ReadonlyArray<{ word: string; tts_text?: string }> = [
  { word: 'customer' },
  { word: 'client' },
  { word: 'satisfaction' },
  { word: 'complaint' },
  { word: 'to handle' },
  /** Comma pause avoids eliding the final consonant in "resolve" */
  { word: 'to resolve', tts_text: 'to, resolve' },
  { word: 'query' },
  { word: 'feedback' },
  { word: 'after-sales service' },
  { word: 'guarantee' },
  { word: 'refund' },
  { word: 'exchange' },
  { word: 'faulty' },
  { word: 'defective' },
  { word: 'apology' },
  { word: 'response time' },
  { word: 'retention' },
  { word: 'courteous' },
  { word: 'escalation' },
  /** Comma pause keeps the plural "-s" on "standards" audible */
  { word: 'service standards', tts_text: 'service, standards' },
]

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function audioFilename(word: string): string {
  return `${word}.mp3`
}

async function generateSpeech(apiKey: string, text: string, seed: number): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ALICE_VOICE_ID}`,
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

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`ElevenLabs API error ${response.status}: ${body}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const skipExisting = process.argv.includes('--skip-existing')
  const forceRegenerate = process.argv.includes('--force')
  const wordsArgIndex = process.argv.indexOf('--words')
  const wordsFilter =
    wordsArgIndex >= 0
      ? process.argv[wordsArgIndex + 1]
          ?.split(',')
          .map((w) => w.trim().toLowerCase())
          .filter(Boolean)
      : null

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!dryRun && !apiKey) {
    throw new Error('ELEVENLABS_API_KEY is missing. Add it to .env.local and try again.')
  }

  const items = wordsFilter?.length
    ? WORDS.filter((w) => wordsFilter.includes(w.word.toLowerCase()))
    : WORDS

  if (wordsFilter?.length && items.length === 0) {
    throw new Error(`No words matched --words filter: ${wordsFilter.join(', ')}`)
  }

  console.log(`Voice: Alice — Clear, Engaging Educator (${ALICE_VOICE_ID})`)
  console.log(`Model: ${TTS_MODEL_ID}, output: ${OUTPUT_DIR}`)
  console.log(`Words: ${items.length}`)

  if (dryRun) {
    for (const item of items) {
      console.log(`  [dry-run] ${item.word} → ${audioFilename(item.word)}`)
    }
    return
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const item of items) {
    const filename = audioFilename(item.word)
    const outPath = join(OUTPUT_DIR, filename)
    const cachePath = join(CACHE_DIR, filename.replace(/[^a-z0-9.-]+/gi, '_'))

    if (skipExisting && existsSync(outPath) && !forceRegenerate) {
      console.log(`  skip (exists): ${item.word}`)
      skipped++
      continue
    }

    try {
      const spokenText = item.tts_text ?? item.word
      const seed = item.tts_text ? TTS_SEED + spokenText.length : TTS_SEED

      let audioBuffer: Buffer
      if (!forceRegenerate && existsSync(cachePath)) {
        audioBuffer = readFileSync(cachePath)
        console.log(`  cache hit: ${item.word}`)
      } else {
        console.log(`  generating: ${item.word}`)
        audioBuffer = await generateSpeech(apiKey!, spokenText, seed)
        writeFileSync(cachePath, audioBuffer)
        await sleep(300)
      }

      writeFileSync(outPath, audioBuffer)
      generated++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`  FAILED: ${item.word} — ${message}`)
      failed++
    }
  }

  console.log(`\nDone. Generated: ${generated}, skipped: ${skipped}, failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
