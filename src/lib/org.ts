import { createClient } from '@/lib/supabase/server'
import type { Organization } from '@/types/database'
import { cookies } from 'next/headers'

export const ACTIVE_ORG_COOKIE = 'orbit_org_id'

export async function getCurrentOrganization(): Promise<Organization | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null

  const query = supabase
    .from('organization_members')
    .select('organization_id, organizations!inner(*)')
    .eq('user_id', user.id)

  const { data: membership } = activeOrgId
    ? await query.eq('organization_id', activeOrgId).maybeSingle()
    : await query.limit(1).maybeSingle()

  if (!membership?.organizations) return null
  return membership.organizations as unknown as Organization
}

export async function getOrganizationId(): Promise<string | null> {
  const org = await getCurrentOrganization()
  return org?.id ?? null
}
