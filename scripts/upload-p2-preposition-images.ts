/**
 * Upload Practice #2 images to Supabase Storage (toeic/prepositions/)
 * so worksheet HTML can use stable public URLs (same pattern as speaking-describing-an-image).
 *
 * Usage: npx tsx scripts/upload-p2-preposition-images.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const BUCKET = 'toeic'
const PREFIX = 'prepositions'
const FILES = ['P2-1.png', 'P2-2.png', 'P2-3.png', 'P2-4.png', 'P2-5.png', 'P2-6.png', 'P2-7.png', 'P2-8.png']

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  for (const name of FILES) {
    const localPath = join(process.cwd(), 'public', 'images', 'prepositions', name)
    const buffer = readFileSync(localPath)
    const storagePath = `${PREFIX}/${name}`

    const { error } = await supabaseServer.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

    if (error) {
      console.error(`Upload failed for ${name}:`, error.message)
      process.exit(1)
    }
    console.log(`Uploaded ${storagePath}`)
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
