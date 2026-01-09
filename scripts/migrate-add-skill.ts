import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local manually
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  console.warn('Could not load .env.local file')
}

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ulrwcortyhassmytkcij.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Please add it to .env.local')
  process.exit(1)
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function main() {
  console.log('🔄 Migrating resources to add skill field...')

  try {
    // First, get all resources
    const { data: resources, error: fetchError } = await supabaseServer
      .from('Resource')
      .select('id, title')

    if (fetchError) {
      console.error('❌ Error fetching resources:', fetchError.message)
      process.exit(1)
    }

    if (!resources || resources.length === 0) {
      console.log('ℹ️  No resources found to migrate.')
      return
    }

    console.log(`📋 Found ${resources.length} resources to update.`)

    // Update each resource
    let updated = 0
    let errors = 0

    for (const resource of resources) {
      // Determine skill based on title
      const skill = resource.title.toLowerCase().includes('placement test')
        ? 'TESTS'
        : 'GRAMMAR'

      const { error: updateError } = await supabaseServer
        .from('Resource')
        .update({ skill })
        .eq('id', resource.id)

      if (updateError) {
        console.error(`❌ Error updating "${resource.title}":`, updateError.message)
        errors++
      } else {
        console.log(`✅ Updated "${resource.title}" → ${skill}`)
        updated++
      }
    }

    console.log('')
    console.log(`✅ Migration complete!`)
    console.log(`   Updated: ${updated}`)
    if (errors > 0) {
      console.log(`   Errors: ${errors}`)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
