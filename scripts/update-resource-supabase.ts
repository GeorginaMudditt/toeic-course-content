import { supabaseServer } from '../lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
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
    allResources?.forEach(r => console.log(`   - ${r.title}`))
    console.log('\nPlease create the resource first through the web interface, then run this script again.')
    return
  }

  const resource = resources[0]

  // Update the resource with the new HTML content
  const { data: updated, error: updateError } = await supabaseServer
    .from('Resource')
    .update({ content: htmlContent })
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
