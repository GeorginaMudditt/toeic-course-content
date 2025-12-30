import { createClient } from '@supabase/supabase-js'

// Using the same Supabase project as the database (ulrwcortyhassmytkcij)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ulrwcortyhassmytkcij.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.')
}

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

// Server-side Supabase client for authentication (uses service_role key to bypass RLS)
// This is safe because it's only used server-side in API routes
// Prefer service_role key, fallback to anon key if not available
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

export const supabaseServer = createClient(
  supabaseUrl, 
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)
