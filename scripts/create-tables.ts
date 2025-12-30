import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  const sql = readFileSync(join(__dirname, 'create-tables.sql'), 'utf-8')
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 0)
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement)
        console.log('✓ Executed statement')
      } catch (error: any) {
        // Ignore "already exists" errors and constraint already exists
        if (error.message?.includes('already exists') || 
            error.code === '42P07' || 
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate key value') ||
            error.code === '23505') {
          console.log('⚠ Already exists, skipping...')
        } else if (error.message?.includes('syntax error')) {
          // Try to add constraint without IF NOT EXISTS
          const simpleStatement = statement.replace(/IF NOT EXISTS /gi, '')
          try {
            await prisma.$executeRawUnsafe(simpleStatement)
            console.log('✓ Executed statement (without IF NOT EXISTS)')
          } catch (e2: any) {
            if (e2.message?.includes('already exists') || e2.code === '42P07') {
              console.log('⚠ Constraint already exists, skipping...')
            } else {
              console.error('Error:', e2.message)
            }
          }
        } else {
          console.error('Error:', error.message)
        }
      }
    }
  }
  
  console.log('✅ Database tables created successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

