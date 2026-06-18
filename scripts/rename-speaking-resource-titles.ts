import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const RENAMES: { oldTitle: string; newTitle: string; htmlFile: string }[] = [
  {
    oldTitle: 'TOEICⓇ Speaking: Your Future Career',
    newTitle: 'Speaking: Your Future Career',
    htmlFile: 'speaking-your-future-career-html.html',
  },
  {
    oldTitle: 'TOEIC®️ Speaking: AI in the Workplace',
    newTitle: 'Speaking: AI in the Workplace',
    htmlFile: 'speaking-ai-html.html',
  },
  {
    oldTitle: 'TOEIC®️ Speaking: Work-Life Balance',
    newTitle: 'Speaking: Work-Life Balance',
    htmlFile: 'speaking-work-life-balance-html.html',
  },
  {
    oldTitle: 'TOEIC®️ Speaking: Remote Work',
    newTitle: 'Speaking: Remote Work',
    htmlFile: 'speaking-remote-work-html.html',
  },
  {
    oldTitle: 'TOEIC®️ Speaking: The Workplace',
    newTitle: 'Speaking: The Workplace',
    htmlFile: 'speaking-the-workplace-html.html',
  },
]

async function main() {
  const { supabaseServer } = await import('../lib/supabase')

  for (const { oldTitle, newTitle, htmlFile } of RENAMES) {
    console.log(`Renaming "${oldTitle}" → "${newTitle}"...`)

    const { data: matches, error: findError } = await supabaseServer
      .from('Resource')
      .select('id, title')
      .eq('title', oldTitle)

    if (findError) {
      console.error(`❌ Error finding resource: ${findError.message}`)
      process.exit(1)
    }

    if (!matches || matches.length === 0) {
      console.error(`❌ Resource not found: "${oldTitle}"`)
      process.exit(1)
    }

    const htmlContent = readFileSync(join(process.cwd(), 'resources', htmlFile), 'utf-8')

    const { error: updateError } = await supabaseServer
      .from('Resource')
      .update({
        title: newTitle,
        content: htmlContent,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', matches[0].id)

    if (updateError) {
      console.error(`❌ Error updating resource: ${updateError.message}`)
      process.exit(1)
    }

    console.log(`✅ Updated (${matches[0].id})`)
  }

  console.log('\n✅ All speaking resource titles renamed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
