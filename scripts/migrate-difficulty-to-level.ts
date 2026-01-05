import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Migrating difficulty column to level...')
  
  try {
    // Add the new level column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "level" TEXT;
    `)
    console.log('✓ Added level column')
    
    // Drop the old difficulty column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Resource" DROP COLUMN IF EXISTS "difficulty";
    `)
    console.log('✓ Removed difficulty column')
    
    console.log('✅ Migration complete!')
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.code === '42703') {
      console.log('⚠ Column already migrated or does not exist')
    } else {
      console.error('Error:', error.message)
      throw error
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


