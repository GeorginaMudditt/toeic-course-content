/**
 * Upload army describing images to Supabase Storage (toeic/Instructions-descriptions-army/)
 * so worksheet HTML can use stable public URLs.
 *
 * Usage: npx tsx scripts/upload-army-describing-images.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const BUCKET = 'toeic'
const PREFIX = 'Instructions-descriptions-army'
const FILES = [
  'army-description1.jpg',
  'army-description2.jpg',
  'army-description3.jpg',
  'army-description4.jpg',
  'army-description5.jpg',
  'army-description6.jpg',
]

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  for (const name of FILES) {
    const localPath = join(process.cwd(), 'public', 'images', 'army', name)
    const buffer = readFileSync(localPath)
    const storagePath = `${PREFIX}/${name}`

    const { error } = await supabaseServer.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: 'image/jpeg',
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
