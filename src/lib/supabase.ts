// Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

let supabase: SupabaseClient

if (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
} else {
  supabase = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: { persistSession: false }
  })
}

export { supabase }