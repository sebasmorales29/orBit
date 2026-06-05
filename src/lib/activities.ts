import type { SupabaseClient } from '@supabase/supabase-js'

interface LogActivityInput {
  organizationId: string
  type: string
  description: string
  leadId?: string
  orderId?: string
  metadata?: Record<string, unknown>
}

export async function logActivity(
  supabase: SupabaseClient,
  input: LogActivityInput
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.from('activities').insert({
    organization_id: input.organizationId,
    user_id: user?.id ?? null,
    type: input.type,
    description: input.description,
    lead_id: input.leadId ?? null,
    order_id: input.orderId ?? null,
    metadata: input.metadata ?? {},
  })
}
