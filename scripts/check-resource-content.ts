// Load environment variables FIRST before any other imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Try .env.local first (Next.js convention), then .env
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

config({ path: envLocalPath })
config({ path: envPath })

async function main() {
  // Dynamically import supabase after env vars are loaded
  const { supabaseServer } = await import('../lib/supabase')

  const resourceName = process.argv[2] || 'Present Perfect Continuous'

  console.log(`🔍 Checking resource: "${resourceName}"...\n`)

  // Find the resource by name
  const { data: resources, error: findError } = await supabaseServer
    .from('Resource')
    .select('id, title, content')
    .ilike('title', `%${resourceName}%`)

  if (findError) {
    console.error('❌ Error finding resource:', findError.message)
    process.exit(1)
  }

  if (!resources || resources.length === 0) {
    console.log(`❌ Resource "${resourceName}" not found in database.`)
    return
  }

  const resource = resources[0]
  
  // Check for the star icon
  const hasStar = resource.content.includes('⭐') || resource.content.includes('&#9733;')
  const hasQuickComparison = resource.content.includes('Quick Comparison')
  
  console.log(`Resource ID: ${resource.id}`)
  console.log(`Title: ${resource.title}`)
  console.log(`Content length: ${resource.content.length} characters`)
  console.log(`Contains "Quick Comparison": ${hasQuickComparison}`)
  console.log(`Contains star icon: ${hasStar}`)
  
  if (hasQuickComparison) {
    // Find the line with Quick Comparison
    const lines = resource.content.split('\n')
    const quickComparisonLine = lines.find((line: string) => line.includes('Quick Comparison'))
    if (quickComparisonLine) {
      console.log(`\nQuick Comparison line in database:`)
      console.log(quickComparisonLine.trim().substring(0, 100) + '...')
    }
  }
  
  // Write to a temp file so we can inspect it
  const { writeFileSync } = await import('fs')
  const { join } = await import('path')
  const tempPath = join(process.cwd(), 'temp-resource-check.html')
  writeFileSync(tempPath, resource.content, 'utf-8')
  console.log(`\n📄 Full content written to: ${tempPath}`)
  console.log(`   You can open this file to see exactly what's in the database.`)
}

main()
  .catch((e) => {
    console.error('Error checking resource:', e)
    process.exit(1)
  })
