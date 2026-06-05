import { createClient } from '@/lib/supabase/server'
import type { Organization } from '@/types/database'

export async function getCurrentOrganization(): Promise<Organization | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations!inner(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organizations) return null
  return membership.organizations as unknown as Organization
}

export async function getOrganizationId(): Promise<string | null> {
  const org = await getCurrentOrganization()
  return org?.id ?? null
}
