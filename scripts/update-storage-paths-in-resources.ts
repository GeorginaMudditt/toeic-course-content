/**
 * Update Supabase Storage paths in all Resource content (HTML).
 * Use when you rename or move a folder in Supabase Storage so that existing
 * image/audio URLs in worksheets keep working.
 *
 * Usage:
 *   npx tsx scripts/update-storage-paths-in-resources.ts "OLD_PATH" "NEW_PATH"
 *
 * Example (if you moved files from bucket root into a subfolder "placement"):
 *   npx tsx scripts/update-storage-paths-in-resources.ts "resources/" "resources/placement/"
 *
 * Example (if you renamed a subfolder):
 *   npx tsx scripts/update-storage-paths-in-resources.ts "resources/old-folder/" "resources/new-folder/"
 *
 * The script finds all Resources whose content contains the old path and
 * replaces it with the new path, then updates the database.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')
config({ path: envLocalPath })
config({ path: envPath })

async function main() {
  const oldPath = process.argv[2]
  const newPath = process.argv[3]

  if (!oldPath || !newPath) {
    console.log('Usage: npx tsx scripts/update-storage-paths-in-resources.ts "OLD_PATH" "NEW_PATH"')
    console.log('Example: npx tsx scripts/update-storage-paths-in-resources.ts "resources/" "resources/placement/"')
    process.exit(1)
  }

  const { supabaseServer } = await import('../lib/supabase')

  // Match paths in both public and signed Supabase storage URLs:
  // https://xxx.supabase.co/storage/v1/object/public/<path>
  // https://xxx.supabase.co/storage/v1/object/sign/<path>?token=...
  const normalizedOld = oldPath.replace(/^\/+|\/+$/g, '')
  const normalizedNew = newPath.replace(/^\/+|\/+$/g, '')
  const pathSegments = ['storage/v1/object/public/', 'storage/v1/object/sign/']

  console.log('Replacing in resource content:')
  for (const seg of pathSegments) {
    console.log('  Old:', seg + normalizedOld)
    console.log('  New:', seg + normalizedNew)
  }
  console.log('')

  const { data: resources, error: fetchError } = await supabaseServer
    .from('Resource')
    .select('id, title, content')
    .not('content', 'is', null)

  if (fetchError) {
    console.error('Error fetching resources:', fetchError.message)
    process.exit(1)
  }

  if (!resources?.length) {
    console.log('No resources found.')
    process.exit(0)
  }

  let updated = 0
  for (const row of resources) {
    let content = row.content as string
    if (typeof content !== 'string') continue

    let changed = false
    for (const pathSegment of pathSegments) {
      const oldFull = pathSegment + normalizedOld
      const newFull = pathSegment + normalizedNew
      if (!content.includes(oldFull)) continue
      content = content.split(oldFull).join(newFull)
      changed = true
    }
    if (!changed) continue

    const newContent = content
    const { error: updateError } = await supabaseServer
      .from('Resource')
      .update({ content: newContent, updatedAt: new Date().toISOString() })
      .eq('id', row.id)

    if (updateError) {
      console.error(`Failed to update "${row.title}":`, updateError.message)
      continue
    }
    console.log('Updated:', row.title)
    updated++
  }

  console.log('')
  console.log('Done. Updated', updated, 'resource(s).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
