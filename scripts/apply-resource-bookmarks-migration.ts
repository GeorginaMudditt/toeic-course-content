import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const sql = readFileSync(
    resolve(process.cwd(), 'supabase-migration-resource-bookmarks.sql'),
    'utf-8'
  )

  try {
    await prisma.$executeRawUnsafe(sql)
    console.log('✅ ResourceBookmark migration applied successfully.')
  } catch (error) {
    console.error('❌ Could not apply migration automatically.')
    console.error(error)
    console.log('\nPlease run supabase-migration-resource-bookmarks.sql in the Supabase SQL editor.')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
