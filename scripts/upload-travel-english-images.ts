/**
 * Upload Travel English worksheet images to Supabase Storage.
 *
 * Usage: npx tsx scripts/upload-travel-english-images.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const BUCKET = 'travel-english'
const FILES = [
  { name: 'confused-man-car-rental.jpg', contentType: 'image/jpeg' },
]

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  for (const file of FILES) {
    const localPath = join(process.cwd(), 'public', 'images', 'travel-english', file.name)
    const buffer = readFileSync(localPath)

    const { error } = await supabaseServer.storage.from(BUCKET).upload(file.name, buffer, {
      contentType: file.contentType,
      upsert: true,
    })

    if (error) {
      console.error(`Upload failed for ${file.name}:`, error.message)
      process.exit(1)
    }

    console.log(`Uploaded ${BUCKET}/${file.name}`)
  }

  console.log('Done.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
