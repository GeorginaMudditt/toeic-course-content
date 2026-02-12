// Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Try .env.local first (Next.js convention), then .env
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

config({ path: envLocalPath })
config({ path: envPath })

// Now import other modules after env vars are loaded
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

async function main() {
  // Dynamically import supabase after env vars are loaded
  const { supabaseServer } = await import('../lib/supabase')

  console.log('🔄 Syncing HTML files from database...\n')

  // Fetch all resources from database
  const { data: resources, error: fetchError } = await supabaseServer
    .from('Resource')
    .select('id, title, content, type')
    .order('title', { ascending: true })

  if (fetchError) {
    console.error('❌ Error fetching resources:', fetchError.message)
    process.exit(1)
  }

  if (!resources || resources.length === 0) {
    console.log('⚠️  No resources found in database.')
    return
  }

  // Ensure resources directory exists
  const resourcesDir = join(process.cwd(), 'resources')
  try {
    mkdirSync(resourcesDir, { recursive: true })
  } catch (error) {
    // Directory might already exist, that's fine
  }

  let syncedCount = 0
  let skippedCount = 0
  const skipped: string[] = []

  for (const resource of resources) {
    // Skip resources that don't have HTML content
    // HTML content typically starts with '<' or contains HTML tags
    // File paths typically start with '/uploads/' or 'uploads/'
    const isHTML = resource.content && 
                   typeof resource.content === 'string' && 
                   (resource.content.trim().startsWith('<') || 
                    resource.content.includes('<html') ||
                    resource.content.includes('<!DOCTYPE') ||
                    resource.content.includes('<div') ||
                    resource.content.includes('<style'))

    if (!isHTML) {
      skippedCount++
      skipped.push(`${resource.title} (${resource.type || 'file-based'})`)
      continue
    }

    // Generate filename from title
    const filename = `${resource.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-html.html`
    const filePath = join(resourcesDir, filename)

    try {
      writeFileSync(filePath, resource.content, 'utf-8')
      console.log(`✅ Synced: ${resource.title}`)
      console.log(`   → ${filename}`)
      syncedCount++
    } catch (error) {
      console.error(`❌ Error writing ${filename}:`, error)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully synced ${syncedCount} HTML resource(s)`)
  if (skippedCount > 0) {
    console.log(`⏭️  Skipped ${skippedCount} resource(s) (file-based or no HTML content):`)
    skipped.forEach(name => console.log(`   - ${name}`))
  }
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('Error syncing resources:', e)
    process.exit(1)
  })
