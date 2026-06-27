/**
 * Create the Elouafi pilot family: one GUARDIAN + three linked STUDENT profiles.
 *
 * Prerequisites:
 * - GUARDIAN role and FamilyMembership table (scripts/sql/add-guardian-family.sql)
 * - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   PILOT_FAMILY_PASSWORD='your-temp-password' npx tsx scripts/setup-pilot-family-elouafi.ts
 *   PILOT_FAMILY_PASSWORD='mounira123' npx tsx scripts/setup-pilot-family-elouafi.ts --reset-password
 *   npx tsx scripts/setup-pilot-family-elouafi.ts --dry-run
 */

import { config } from 'dotenv'
import { randomBytes } from 'crypto'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const DRY_RUN = process.argv.includes('--dry-run')
const RESET_PASSWORD = process.argv.includes('--reset-password')

const PILOT = {
  guardian: {
    name: 'Mounira',
    email: 'elouafimounira@yahoo.fr',
  },
  children: [
    { name: 'Mahel', email: 'family-elouafi-mahel@internal.brizzle', displayOrder: 1 },
    { name: 'Jasmine', email: 'family-elouafi-jasmine@internal.brizzle', displayOrder: 2 },
    { name: 'Hedi', email: 'family-elouafi-hedi@internal.brizzle', displayOrder: 3 },
  ],
} as const

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomHex = randomBytes(6).toString('hex')
  const randomPart = parseInt(randomHex, 16).toString(36).padStart(12, '0').substring(0, 12)
  return `c${timestamp}${randomPart}`
}

function generateRandomPassword(length = 12): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(length)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function findUserByEmail(supabase: Awaited<ReturnType<typeof getSupabase>>, email: string) {
  const { data, error } = await supabase
    .from('User')
    .select('id, email, name, role')
    .eq('email', email.toLowerCase().trim())
    .limit(1)

  if (error) throw new Error(`Lookup failed for ${email}: ${error.message}`)
  return data?.[0] ?? null
}

async function getSupabase() {
  const { supabaseServer } = await import('../lib/supabase')
  return supabaseServer
}

async function createUser(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  row: Record<string, unknown>
) {
  if (DRY_RUN) {
    console.log('[dry-run] would insert User:', { ...row, password: '[hashed]' })
    return { id: String(row.id), email: String(row.email), name: String(row.name), role: String(row.role) }
  }

  const { data, error } = await supabase.from('User').insert(row).select('id, email, name, role').single()
  if (error) throw new Error(`Create user failed (${row.email}): ${error.message}`)
  return data
}

async function ensureMembership(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  guardianId: string,
  childStudentId: string,
  displayOrder: number
) {
  const { data: existing, error: lookupError } = await supabase
    .from('FamilyMembership')
    .select('id')
    .eq('guardianId', guardianId)
    .eq('childStudentId', childStudentId)
    .limit(1)

  if (lookupError) throw new Error(`FamilyMembership lookup failed: ${lookupError.message}`)
  if (existing?.length) {
    console.log(`✓ Link already exists (order ${displayOrder})`)
    return
  }

  if (DRY_RUN) {
    console.log('[dry-run] would insert FamilyMembership:', { guardianId, childStudentId, displayOrder })
    return
  }

  const { error } = await supabase.from('FamilyMembership').insert({
    id: generateCuid(),
    guardianId,
    childStudentId,
    displayOrder,
  })

  if (error) throw new Error(`FamilyMembership insert failed: ${error.message}`)
  console.log(`✓ Linked child ${displayOrder}`)
}

async function main() {
  const supabase = await getSupabase()
  const now = new Date().toISOString()
  const guardianPassword = process.env.PILOT_FAMILY_PASSWORD || generateRandomPassword()
  const passwordWasGenerated = !process.env.PILOT_FAMILY_PASSWORD

  console.log(DRY_RUN ? 'Dry run — Elouafi pilot family setup' : 'Creating Elouafi pilot family...')
  console.log('Guardian:', PILOT.guardian.email)

  // Guardian
  let guardianCreated = false
  let guardian = await findUserByEmail(supabase, PILOT.guardian.email)
  if (guardian) {
    console.log(`✓ Guardian already exists: ${guardian.name} (${guardian.id})`)
    if (guardian.role !== 'GUARDIAN') {
      console.warn(`  ⚠ Existing user role is "${guardian.role}", expected GUARDIAN`)
    }
    if (RESET_PASSWORD && process.env.PILOT_FAMILY_PASSWORD) {
      if (DRY_RUN) {
        console.log('[dry-run] would reset guardian password')
      } else {
        const hashedPassword = await bcrypt.hash(process.env.PILOT_FAMILY_PASSWORD, 10)
        const { error } = await supabase
          .from('User')
          .update({ password: hashedPassword, updatedAt: now })
          .eq('id', guardian.id)
        if (error) throw new Error(`Password reset failed: ${error.message}`)
        console.log('✓ Guardian password updated')
      }
    }
  } else {
    guardianCreated = true
    const hashedPassword = await bcrypt.hash(guardianPassword, 10)
    guardian = await createUser(supabase, {
      id: generateCuid(),
      name: PILOT.guardian.name,
      email: PILOT.guardian.email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'GUARDIAN',
      createdAt: now,
      updatedAt: now,
    })
    console.log(`✓ Created guardian: ${guardian!.name} (${guardian!.id})`)
  }

  // Children
  const childIds: string[] = []
  for (const child of PILOT.children) {
    let student = await findUserByEmail(supabase, child.email)
    if (student) {
      console.log(`✓ Child already exists: ${student.name} (${student.id})`)
    } else {
      student = await createUser(supabase, {
        id: generateCuid(),
        name: child.name,
        email: child.email.toLowerCase().trim(),
        password: await bcrypt.hash(generateRandomPassword(24), 10),
        role: 'STUDENT',
        studentLifecycleStatus: 'TESTING',
        createdAt: now,
        updatedAt: now,
      })
      console.log(`✓ Created child: ${student!.name} (${student!.id})`)
    }
    childIds.push(student!.id)
    await ensureMembership(supabase, guardian!.id, student!.id, child.displayOrder)
  }

  console.log('\n--- Pilot family ready ---')
  console.log('Guardian login email:', PILOT.guardian.email)
  if (!DRY_RUN) {
    if (RESET_PASSWORD && process.env.PILOT_FAMILY_PASSWORD) {
      console.log('Guardian password: updated via --reset-password')
    } else if (guardianCreated && passwordWasGenerated) {
      console.log('Guardian temporary password (share securely with Mounira):', guardianPassword)
    } else if (guardianCreated) {
      console.log('Guardian password: set via PILOT_FAMILY_PASSWORD env var')
    } else {
      console.log('Guardian password: unchanged (account already existed)')
    }
  }
  console.log('\nChildren (vocabulary profiles):')
  PILOT.children.forEach((child, i) => {
    console.log(`  ${child.displayOrder}. ${child.name} — student id ${childIds[i]}`)
  })
  console.log('\nNote: Guardians use /family to pick a learner, then /student/vocabulary.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
