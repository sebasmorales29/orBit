'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  generateWebhookSecret,
  hashWebhookSecret,
  secretDisplayPrefix,
} from '@/lib/integrations/secret'
import { getCurrentOrganization } from '@/lib/org'

export type CreateConnectionResult =
  | { ok: true; secret: string; connectionId: string }
  | { ok: false; error: string }

export async function createIntegrationConnection(
  name: string,
  provider: string = 'custom'
): Promise<CreateConnectionResult> {
  const org = await getCurrentOrganization()
  if (!org) return { ok: false, error: 'NO_ORG' }

  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'NAME_REQUIRED' }

  const secret = generateWebhookSecret()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('integration_connections')
    .insert({
      organization_id: org.id,
      name: trimmed,
      provider,
      secret_hash: hashWebhookSecret(secret),
      secret_prefix: secretDisplayPrefix(secret),
      settings: { default_source: 'tienda_online' },
    })
    .select('id')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'INSERT_FAILED' }
  }

  revalidatePath('/integraciones')
  return { ok: true, secret, connectionId: data.id }
}

export async function revokeIntegrationConnection(connectionId: string): Promise<{ ok: boolean }> {
  const org = await getCurrentOrganization()
  if (!org) return { ok: false }

  const supabase = await createClient()
  await supabase
    .from('integration_connections')
    .update({ active: false })
    .eq('id', connectionId)
    .eq('organization_id', org.id)

  revalidatePath('/integraciones')
  return { ok: true }
}
