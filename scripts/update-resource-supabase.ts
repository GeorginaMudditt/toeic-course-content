// Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Try .env.local first (Next.js convention), then .env
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

config({ path: envLocalPath })
config({ path: envPath })

// Now import other modules after env vars are loaded
import { readFileSync } from 'fs'
import { join } from 'path'

// Import supabase AFTER env vars are loaded
// We need to dynamically import to ensure env vars are loaded first
let supabaseServer: any

async function main() {
  // Dynamically import supabase after env vars are loaded
  const { supabaseServer: server } = await import('../lib/supabase')
  supabaseServer = server

  // Get resource name from command line argument
  const resourceName = process.argv[2]
  const htmlFileName = process.argv[3] || `${resourceName.toLowerCase().replace(/\s+/g, '-')}-html.html`

  if (!resourceName) {
    console.log('❌ Please provide a resource name as an argument.')
    console.log('Usage: tsx scripts/update-resource-supabase.ts "Resource Name" [html-file-name]')
    console.log('Example: tsx scripts/update-resource-supabase.ts "Placement Test"')
    console.log('Example: tsx scripts/update-resource-supabase.ts "Placement Test" "placement-test-html.html"')
    process.exit(1)
  }

  console.log(`Updating resource: "${resourceName}"...`)

  // Read the HTML content from the file
  const htmlPath = join(process.cwd(), 'resources', htmlFileName)
  
  let htmlContent: string
  try {
    htmlContent = readFileSync(htmlPath, 'utf-8')
  } catch (error) {
    console.log(`❌ Could not read file: resources/${htmlFileName}`)
    console.log('Please make sure the file exists in the resources/ folder.')
    process.exit(1)
  }

  // Find the resource by name (case-insensitive, partial match)
  const { data: resources, error: findError } = await supabaseServer
    .from('Resource')
    .select('id, title')
    .ilike('title', `%${resourceName}%`)

  if (findError) {
    console.error('❌ Error finding resource:', findError.message)
    process.exit(1)
  }

  if (!resources || resources.length === 0) {
    console.log(`❌ Resource "${resourceName}" not found in database.`)
    console.log('Available resources:')
    const { data: allResources } = await supabaseServer
      .from('Resource')
      .select('id, title')
      .limit(10)
    allResources?.forEach((r: { title: string }) => console.log(`   - ${r.title}`))
    console.log('\nPlease create the resource first through the web interface, then run this script again.')
    return
  }

  const resource = resources[0]

  // Update the resource with the new HTML content
  // Explicitly set updatedAt to current timestamp (like the API route does)
  const { data: updated, error: updateError } = await supabaseServer
    .from('Resource')
    .update({ 
      content: htmlContent,
      updatedAt: new Date().toISOString()
    })
    .eq('id', resource.id)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error updating resource:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Successfully updated resource!')
  console.log(`   Resource ID: ${updated.id}`)
  console.log(`   Title: ${updated.title}`)
  console.log(`   Content length: ${htmlContent.length} characters`)
}

main()
  .catch((e) => {
    console.error('Error updating resource:', e)
    process.exit(1)
  })
