import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const source = join(__dirname, '../../new-brizzle-website/lib/adult-course-descriptions.ts')
const destination = join(__dirname, '../lib/adult-course-descriptions.ts')

if (!existsSync(source)) {
  console.log('new-brizzle-website not found — keeping bundled course descriptions')
  process.exit(0)
}

const syncedHeader = `/**
 * Synced from new-brizzle-website/lib/adult-course-descriptions.ts
 * Run \`npm run sync:course-descriptions\` after updating PDF URLs on the website.
 */

`

const sourceContents = readFileSync(source, 'utf8')
const body = sourceContents.replace(/^\/\*\*[\s\S]*?\*\/\s*/, '')
writeFileSync(destination, syncedHeader + body)
console.log('Synced course descriptions from new-brizzle-website')
