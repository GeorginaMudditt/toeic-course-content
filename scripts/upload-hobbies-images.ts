/**
 * Upload Hobbies reading images to Supabase Storage (toeic/hobbies/).
 *
 * Usage: npx tsx scripts/upload-hobbies-images.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve, join } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const BUCKET = 'toeic'
const PREFIX = 'hobbies'
const FILES = ['hiking.jpg', 'games.jpg', 'baking.jpg', 'sports.jpg']

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  for (const name of FILES) {
    const localPath = join(process.cwd(), 'public', 'images', 'hobbies', name)
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

    const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(storagePath)
    console.log(data.publicUrl)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
