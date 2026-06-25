/**
 * Create a Resource row in Supabase (or update content if title already exists).
 * Run: npx tsx scripts/create-resource-supabase.ts "Vocabulary: Customer Service" customer-service-vocabulary-html.html
 */
import { config } from 'dotenv'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join, resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  const title = process.argv[2]
  const htmlFileName = process.argv[3]

  if (!title || !htmlFileName) {
    console.log('Usage: npx tsx scripts/create-resource-supabase.ts "Resource Title" file.html')
    process.exit(1)
  }

  const htmlPath = join(process.cwd(), 'resources', htmlFileName)
  const content = readFileSync(htmlPath, 'utf-8')

  const { data: existing } = await supabaseServer
    .from('Resource')
    .select('id, title')
    .ilike('title', title.trim())
    .limit(1)

  if (existing?.[0]) {
    const { data: updated, error } = await supabaseServer
      .from('Resource')
      .update({ content, updatedAt: new Date().toISOString() })
      .eq('id', existing[0].id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating resource:', error.message)
      process.exit(1)
    }

    console.log('✅ Updated existing resource')
    console.log(`   Resource ID: ${updated.id}`)
    console.log(`   Title: ${updated.title}`)
    return
  }

  const { data: template } = await supabaseServer
    .from('Resource')
    .select('creatorId, type, level, skill, estimatedHours')
    .ilike('title', '%Jobs, People%')
    .limit(1)

  const ref = template?.[0]
  if (!ref?.creatorId) {
    console.error('❌ Could not find a vocabulary template resource to copy metadata from.')
    process.exit(1)
  }

  const id = randomUUID()
  const now = new Date().toISOString()

  const { data: created, error } = await supabaseServer
    .from('Resource')
    .insert({
      id,
      title,
      description: null,
      type: ref.type,
      content,
      estimatedHours: ref.estimatedHours ?? 1,
      level: ref.level,
      skill: ref.skill,
      creatorId: ref.creatorId,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating resource:', error.message)
    process.exit(1)
  }

  console.log('✅ Created resource')
  console.log(`   Resource ID: ${created.id}`)
  console.log(`   Title: ${created.title}`)
  console.log(`   Type: ${created.type} | Skill: ${created.skill} | Level: ${created.level}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
