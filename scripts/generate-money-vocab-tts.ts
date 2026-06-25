/**
 * Generate Money worksheet pronunciation audio via ElevenLabs TTS.
 * Saves to public/vocab-audio/money-vocab-audio/{word}.mp3
 *
 * Prerequisites: ELEVENLABS_API_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/generate-money-vocab-tts.ts
 *   npx tsx scripts/generate-money-vocab-tts.ts --dry-run
 *   npx tsx scripts/generate-money-vocab-tts.ts --skip-existing
 *   npx tsx scripts/generate-money-vocab-tts.ts --force
 */

import { config } from 'dotenv'
import { execFileSync, spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

/** Alice — Clear, Engaging Educator (ElevenLabs premade voice) */
const ALICE_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'
const TTS_MODEL_ID = 'eleven_turbo_v2_5'
const TTS_LANGUAGE_CODE = 'en'
const TTS_SEED = 42

const OUTPUT_DIR = join(process.cwd(), 'public', 'vocab-audio', 'money-vocab-audio')
const CACHE_DIR = join(process.cwd(), '.cache', 'money-vocab-audio')

const WORDS: ReadonlyArray<{ word: string; tts_text?: string; trim_prefix?: string }> = [
  { word: 'salary' },
  { word: 'overtime' },
  { word: 'remuneration' },
  { word: 'compensation' },
  { word: 'pension' },
  { word: 'commission' },
  { word: 'mortgage' },
  { word: 'share options' },
  { word: 'bonus' },
  { word: 'sales', tts_text: 'sales.' },
  { word: 'target' },
  { word: 'turnover' },
  { word: 'forecast' },
  { word: 'budget' },
  { word: 'growth' },
  { word: 'expenses', tts_text: 'travel expenses', trim_prefix: 'travel ' },
  { word: 'fixed costs' },
  { word: 'variable costs', tts_text: 'variable costs.' },
  { word: 'overheads' },
  { word: 'margin' },
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

function getAudioDurationSeconds(filePath: string): number {
  const out = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    { encoding: 'utf-8' }
  )
  return parseFloat(out.trim())
}

function trimAudioFromBuffer(input: Buffer, startSeconds: number): Buffer {
  const tmpIn = join(tmpdir(), `money-tts-trim-in-${Date.now()}.mp3`)
  const tmpOut = join(tmpdir(), `money-tts-trim-out-${Date.now()}.mp3`)
  writeFileSync(tmpIn, input)
  try {
    execFileSync(
      'ffmpeg',
      ['-y', '-ss', startSeconds.toFixed(3), '-i', tmpIn, '-acodec', 'libmp3lame', '-q:a', '2', tmpOut],
      { stdio: 'pipe' }
    )
    return readFileSync(tmpOut)
  } finally {
    try {
      unlinkSync(tmpIn)
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(tmpOut)
    } catch {
      /* ignore */
    }
  }
}

function detectInterWordTrimPoint(filePath: string): number {
  const { stderr } = spawnSync(
    'ffmpeg',
    ['-i', filePath, '-af', 'silencedetect=noise=-28dB:d=0.04', '-f', 'null', '-'],
    { encoding: 'utf8' }
  )
  const ffmpegLog = stderr ?? ''

  const duration = getAudioDurationSeconds(filePath)
  const silenceEnds = [...ffmpegLog.matchAll(/silence_end: ([\d.]+)/g)]
    .map((match) => parseFloat(match[1]!))
    .filter((time) => time > 0.12 && time < duration * 0.8)

  if (!silenceEnds.length) {
    throw new Error(`Could not detect word boundary in ${filePath}`)
  }

  return Math.max(...silenceEnds)
}

async function applyTrimPrefix(audioBuffer: Buffer): Promise<Buffer> {
  const tmpFull = join(tmpdir(), `money-tts-full-${Date.now()}.mp3`)
  writeFileSync(tmpFull, audioBuffer)
  try {
    const trimAt = detectInterWordTrimPoint(tmpFull)
    return trimAudioFromBuffer(audioBuffer, trimAt)
  } finally {
    try {
      unlinkSync(tmpFull)
    } catch {
      /* ignore */
    }
  }
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
        if (item.trim_prefix) {
          audioBuffer = await applyTrimPrefix(audioBuffer)
        }
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
