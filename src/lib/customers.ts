import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '@/types/database'

/** Crea o devuelve el cliente vinculado a un lead ganado. */
export async function ensureCustomerFromLead(
  supabase: SupabaseClient,
  lead: Lead,
  organizationId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('lead_id', lead.id)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from('customers')
    .insert({
      organization_id: organizationId,
      lead_id: lead.id,
      name: lead.name,
      phone: lead.phone,
      total_spent: lead.estimated_amount ?? 0,
    })
    .select('id')
    .single()

  if (error) return null
  return data?.id ?? null
}
