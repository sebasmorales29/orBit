import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv, isServiceRoleConfigured } from '@/lib/supabase/env'

/** Cliente con service role — solo en servidor (API Connect, /ops). */
export function createAdminClient() {
  const env = getSupabaseEnv()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!env || !isServiceRoleConfigured() || !serviceKey) {
    return null
  }

  return createClient(env.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
