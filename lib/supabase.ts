import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Using the same Supabase project as the database (ulrwcortyhassmytkcij)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ulrwcortyhassmytkcij.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Don't throw error during module load - this prevents the entire app from crashing
// Instead, create clients with empty string if key is missing (they'll fail gracefully at runtime)
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && typeof window !== 'undefined') {
  console.error('WARNING: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Please add it to your environment variables.')
}

const authOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
} as const

type SupabaseGlobals = typeof globalThis & {
  __brizzleSupabaseAnon?: SupabaseClient
  __brizzleSupabaseService?: SupabaseClient
}

const g = globalThis as SupabaseGlobals

/**
 * Browser anon client — singleton so dev / HMR does not create multiple GoTrueClient instances
 * (Supabase warns: "Multiple GoTrueClient instances detected in the same browser context").
 */
export const supabase: SupabaseClient =
  g.__brizzleSupabaseAnon ??
  (g.__brizzleSupabaseAnon = createClient(supabaseUrl, supabaseAnonKey, authOptions))

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

/**
 * Service-role client for API routes and Server Components only.
 * Must never be constructed in the browser: importing this module in a client bundle would
 * otherwise create a second GoTrueClient (anon + service) under the same storage key.
 */
export const supabaseServer: SupabaseClient =
  typeof window === 'undefined'
    ? (g.__brizzleSupabaseService ??= createClient(supabaseUrl, supabaseServiceKey, authOptions))
    : (new Proxy({} as SupabaseClient, {
        get() {
          throw new Error(
            'supabaseServer is server-only. Use the anon `supabase` client in browser code, or call an API route.'
          )
        },
      }) as SupabaseClient)
