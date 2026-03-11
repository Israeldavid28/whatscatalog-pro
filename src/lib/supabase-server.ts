import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

let _supabaseServer: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseServer() {
  if (_supabaseServer) return _supabaseServer

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set'
    )
  }

  _supabaseServer = createClient<Database>(supabaseUrl, supabaseKey)
  return _supabaseServer
}

// Backward-compatible export — lazy getter via Proxy
export const supabaseServer: any = new Proxy(
  {} as ReturnType<typeof createClient<Database>>,
  {
    get(_target, prop, receiver) {
      const client = getSupabaseServer()
      const value = (client as any)[prop]
      if (typeof value === 'function') {
        return value.bind(client)
      }
      return value
    },
  }
)
