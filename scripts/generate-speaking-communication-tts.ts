/**
 * Generate slow A2 phrase audio for Speaking: Communication via ElevenLabs TTS.
 * Saves to public/audio/speaking-communication/{slug}.mp3
 *
 * Prerequisites: ELEVENLABS_API_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/generate-speaking-communication-tts.ts
 *   npx tsx scripts/generate-speaking-communication-tts.ts --dry-run
 *   npx tsx scripts/generate-speaking-communication-tts.ts --force
 *   npx tsx scripts/generate-speaking-communication-tts.ts --only can-you-say-that-again-please.mp3
 */
import { config } from 'dotenv'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

/** Alice — Clear, Engaging Educator (ElevenLabs premade voice) */
const ALICE_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'
const TTS_MODEL_ID = 'eleven_turbo_v2_5'
const TTS_LANGUAGE_CODE = 'en'
const TTS_SEED = 42
/** Slow, clear speech for A2 learners (ElevenLabs range 0.7–1.2). */
const TTS_SPEED = 0.75

const OUTPUT_DIR = join(process.cwd(), 'public', 'audio', 'speaking-communication')
const CACHE_DIR = join(process.cwd(), '.cache', 'speaking-communication-audio')

type Phrase = {
  file: string
  text: string
  /** Spoken form — falling intonation uses a full stop instead of a question mark. */
  tts_text?: string
  /** Calmer, less punchy delivery. */
  calm?: boolean
}

const PHRASES: ReadonlyArray<Phrase> = [
  { file: 'sorry-i-dont-understand.mp3', text: "Sorry, I don't understand." },
  { file: 'sorry-i-missed-that.mp3', text: 'Sorry, I missed that.' },
  { file: 'what-does-that-mean.mp3', text: 'What does that mean?' },
  {
    file: 'can-you-say-that-again-please.mp3',
    text: 'Can you say that again, please?',
    tts_text: 'Can you say that again, please.',
    calm: true,
  },
  {
    file: 'can-you-repeat-that-please.mp3',
    text: 'Can you repeat that, please?',
    tts_text: 'Can you repeat that, please.',
    calm: true,
  },
  {
    file: 'can-you-repeat-the-last-part-please.mp3',
    text: 'Can you repeat the last part, please?',
    tts_text: 'Can you repeat the last part, please.',
    calm: true,
  },
  { file: 'can-you-speak-more-slowly-please.mp3', text: 'Can you speak more slowly, please?' },
  { file: 'could-you-speak-more-slowly-please.mp3', text: 'Could you speak more slowly, please?' },
  { file: 'can-you-say-that-more-simply-please.mp3', text: 'Can you say that more simply, please?' },
  {
    file: 'im-learning-english-can-you-use-easy-words-please.mp3',
    text: "I'm learning English. Can you use easy words, please?",
    tts_text: "I'm learning English. Can you use easy words, please.",
    calm: true,
  },
  { file: 'could-you-rephrase-that-more-simply.mp3', text: 'Could you rephrase that more simply?' },
  { file: 'could-you-write-that-down-please.mp3', text: 'Could you write that down, please?' },
  { file: 'could-you-spell-that-please.mp3', text: 'Could you spell that, please?' },
  { file: 'how-do-you-spell-that.mp3', text: 'How do you spell that?' },
  { file: 'im-learning-english-can-you-help-me.mp3', text: "I'm learning English. Can you help me?" },
  { file: 'english-is-not-my-first-language.mp3', text: 'English is not my first language.' },
  { file: 'can-you-give-me-an-example-please.mp3', text: 'Can you give me an example, please?' },
]

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function onlyFiles(): Set<string> | null {
  const flag = process.argv.find((arg) => arg.startsWith('--only'))
  if (!flag) return null
  const value = flag.includes('=')
    ? flag.slice('--only='.length)
    : process.argv[process.argv.indexOf(flag) + 1]
  if (!value || value.startsWith('--')) return null
  return new Set(
    value
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  )
}

async function generateSpeech(apiKey: string, item: Phrase, seed: number): Promise<Buffer> {
  const spokenText = item.tts_text ?? item.text
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
        text: spokenText,
        model_id: TTS_MODEL_ID,
        language_code: TTS_LANGUAGE_CODE,
        seed,
        voice_settings: {
          stability: item.calm ? 0.95 : 0.85,
          similarity_boost: 0.85,
          style: 0,
          use_speaker_boost: !item.calm,
          speed: item.calm ? 0.72 : TTS_SPEED,
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
  const forceRegenerate = process.argv.includes('--force')
  const only = onlyFiles()

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!dryRun && !apiKey) {
    throw new Error('ELEVENLABS_API_KEY is missing. Add it to .env.local and try again.')
  }

  const phrases = only ? PHRASES.filter((item) => only.has(item.file)) : PHRASES
  if (only && phrases.length === 0) {
    throw new Error(`No matching phrases for --only ${[...only].join(', ')}`)
  }

  console.log(`Voice: Alice (${ALICE_VOICE_ID}), speed: ${TTS_SPEED}`)
  console.log(`Output: ${OUTPUT_DIR}`)
  console.log(`Phrases: ${phrases.length}`)

  if (dryRun) {
    for (const item of phrases) {
      console.log(`  [dry-run] ${item.text} → ${item.file}`)
    }
    return
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const item of phrases) {
    const outPath = join(OUTPUT_DIR, item.file)
    const cachePath = join(CACHE_DIR, item.file)

    if (!forceRegenerate && existsSync(outPath)) {
      console.log(`  skip (exists): ${item.file}`)
      skipped++
      continue
    }

    try {
      if (existsSync(cachePath)) unlinkSync(cachePath)
      console.log(`  generating: ${item.text}`)
      const audioBuffer = await generateSpeech(apiKey!, item, TTS_SEED + (item.tts_text ?? item.text).length)
      writeFileSync(cachePath, audioBuffer)
      writeFileSync(outPath, audioBuffer)
      generated++
      await sleep(300)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`  FAILED: ${item.file} — ${message}`)
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
