import { createClient } from '@supabase/supabase-js'

// Use fallback values to prevent "missing environment variables" errors
// during initial build or if they are not yet set. At runtime, if these
// are still missing, network requests will fail gracefully rather than
// crashing the entire app with a client-side exception.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
