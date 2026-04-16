// Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
} else {
  // Create a dummy client for build time - will show errors at runtime
  supabase = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: { persistSession: false }
  })
}

export { supabase }