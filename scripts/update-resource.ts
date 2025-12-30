import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  // Get resource name from command line argument
  const resourceName = process.argv[2]
  const htmlFileName = process.argv[3] || `${resourceName.toLowerCase().replace(/\s+/g, '-')}-html.html`

  if (!resourceName) {
    console.log('❌ Please provide a resource name as an argument.')
    console.log('Usage: npm run update:resource "Resource Name" [html-file-name]')
    console.log('Example: npm run update:resource "Modal Verbs"')
    console.log('Example: npm run update:resource "Modal Verbs" "custom-file.html"')
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
  const resource = await prisma.resource.findFirst({
    where: {
      title: {
        contains: resourceName,
        mode: 'insensitive'
      }
    }
  })

  if (!resource) {
    console.log(`❌ Resource "${resourceName}" not found in database.`)
    console.log('Available resources:')
    const allResources = await prisma.resource.findMany({
      select: { id: true, title: true },
      take: 10
    })
    allResources.forEach(r => console.log(`   - ${r.title}`))
    console.log('\nPlease create the resource first through the web interface, then run this script again.')
    return
  }

  // Update the resource with the new HTML content
  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: {
      content: htmlContent
    }
  })

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
  .finally(async () => {
    await prisma.$disconnect()
  })

