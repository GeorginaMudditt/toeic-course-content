/**
 * Generate Sophie's Day listening audio via ElevenLabs TTS.
 * Saves to public/audio/everyday-english/sophies-day.mp3 and uploads it to the
 * public Supabase bucket everyday-english (the live worksheet plays that URL).
 *
 * Female voice (Alice), slow pace for classroom listening.
 *
 * Prerequisites: ELEVENLABS_API_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/generate-sophies-day-tts.ts
 *   npx tsx scripts/generate-sophies-day-tts.ts --force
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
/** Slow, clear speech (ElevenLabs range 0.7–1.2). */
const TTS_SPEED = 0.72

const OUTPUT_DIR = join(process.cwd(), 'public', 'audio', 'everyday-english')
const OUTPUT_FILE = join(OUTPUT_DIR, 'sophies-day.mp3')
const AUDIO_BUCKET = 'everyday-english'
const AUDIO_PATH = 'sophies-day.mp3'

const SCRIPT = `My name is Sophie, and I am 39 years old. I live in Manchester with my partner. I am a director at a marketing company, and I manage a team of 15 people. My days are often busy, but I enjoy my job.

I get up at 6:45 every morning. I usually do 20 minutes of yoga before I have breakfast. At 7:30, I make coffee and eat porridge while I read the news on my phone. I leave home at 8:15 and take the train to work. My journey takes about 30 minutes.

I arrive at the office at 9:00 and check my emails. At 9:30, I have a meeting with my team. We talk about our projects and plan our work for the week. At 11:00, I usually have a video call with a client. I have lunch at 12:30. Sometimes I eat with my colleagues in a nearby café, and sometimes I bring lunch from home.

In the afternoon, I work on reports and prepare presentations. I often have another meeting at 3:00. I finish work at 5:30 and take the train home. At 6:15, I go shopping or stop at the gym. I usually cook dinner at 7:30. After dinner, I enjoy reading a book or calling my sister. On Wednesdays, I go to an evening photography class at 8:00. I usually go to bed at 10:45.`

async function generateSpeech(apiKey: string): Promise<Buffer> {
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
        text: SCRIPT,
        model_id: TTS_MODEL_ID,
        language_code: TTS_LANGUAGE_CODE,
        seed: TTS_SEED,
        voice_settings: {
          stability: 0.9,
          similarity_boost: 0.85,
          style: 0,
          use_speaker_boost: true,
          speed: TTS_SPEED,
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

async function uploadToStorage(audio: Buffer) {
  const { supabaseServer } = await import('../lib/supabase')
  const { data: buckets } = await supabaseServer.storage.listBuckets()
  if (!buckets?.some((bucket) => bucket.name === AUDIO_BUCKET)) {
    const { error } = await supabaseServer.storage.createBucket(AUDIO_BUCKET, { public: true })
    if (error) throw new Error(`Failed to create bucket "${AUDIO_BUCKET}": ${error.message}`)
    console.log(`Created public bucket: ${AUDIO_BUCKET}`)
  }

  const { error } = await supabaseServer.storage.from(AUDIO_BUCKET).upload(AUDIO_PATH, audio, {
    contentType: 'audio/mpeg',
    upsert: true,
  })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabaseServer.storage.from(AUDIO_BUCKET).getPublicUrl(AUDIO_PATH)
  console.log(`Uploaded ${data.publicUrl}`)
}

async function main() {
  const force = process.argv.includes('--force')
  let audio: Buffer

  if (existsSync(OUTPUT_FILE) && !force) {
    console.log(`Already exists: ${OUTPUT_FILE}`)
    console.log('Pass --force to regenerate. Uploading the existing file.')
    audio = readFileSync(OUTPUT_FILE)
  } else {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is missing. Add it to .env.local and try again.')
    }

    mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`Voice: Alice (${ALICE_VOICE_ID}), speed: ${TTS_SPEED}`)
    audio = await generateSpeech(apiKey)
    writeFileSync(OUTPUT_FILE, audio)
    console.log(`Wrote ${OUTPUT_FILE} (${audio.length} bytes)`)
  }

  await uploadToStorage(audio)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
