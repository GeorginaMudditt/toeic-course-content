import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Making level column required...')
  
  try {
    // First, set a default value for any NULL levels (if any exist)
    await prisma.$executeRawUnsafe(`
      UPDATE "Resource" SET "level" = 'B1' WHERE "level" IS NULL;
    `)
    console.log('✓ Set default level for any NULL values')
    
    // Make the column NOT NULL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Resource" ALTER COLUMN "level" SET NOT NULL;
    `)
    console.log('✓ Made level column required (NOT NULL)')
    
    console.log('✅ Migration complete!')
  } catch (error: any) {
    console.error('Error:', error.message)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())


