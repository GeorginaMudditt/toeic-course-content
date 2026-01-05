import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating Modal Verbs resource...')

  // Read the HTML content from the file
  const htmlPath = join(process.cwd(), 'resources', 'modal-verbs-html.html')
  const htmlContent = readFileSync(htmlPath, 'utf-8')

  // Find the Modal Verbs resource
  const resource = await prisma.resource.findFirst({
    where: {
      title: {
        contains: 'Modal Verbs',
        mode: 'insensitive'
      }
    }
  })

  if (!resource) {
    console.log('❌ Modal Verbs resource not found in database.')
    console.log('Please create it first through the web interface, then run this script again.')
    return
  }

  // Update the resource with the new HTML content
  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: {
      content: htmlContent
    }
  })

  console.log('✅ Successfully updated Modal Verbs resource!')
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


