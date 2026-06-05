import type { SupabaseClient } from '@supabase/supabase-js'
import { timingSafeEqualSecret } from '@/lib/integrations/secret'

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

export async function resolveConnectionBySecret(
  supabase: SupabaseClient,
  secret: string
) {
  const prefix = secret.slice(0, 14)
  const { data: candidates, error } = await supabase
    .from('integration_connections')
    .select('id, organization_id, name, provider, secret_hash, secret_prefix, active, settings')
    .eq('secret_prefix', prefix)
    .eq('active', true)
    .limit(5)

  if (error || !candidates?.length) return null

  for (const row of candidates) {
    if (timingSafeEqualSecret(secret, row.secret_hash)) {
      return row
    }
  }
  return null
}
