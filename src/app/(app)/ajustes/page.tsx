import { AppMain } from '@/components/layout/AppMain'
import { AjustesShell } from '@/components/app/AjustesShell'
import { SettingsClient, type SettingsInitialData } from '@/components/app/SettingsClient'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import type { CurrencyCode } from '@/types/database'

export default async function AjustesPage() {
  const org = await getCurrentOrganization()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!org || !user) {
    return (
      <AjustesShell>
        <AppMain>
          <p className="text-center text-muted">Iniciá sesión para ver tus ajustes.</p>
        </AppMain>
      </AjustesShell>
    )
  }

  const profile = (org.onboarding_profile ?? null) as OnboardingProfile | null
  const preferredName =
    profile?.preferredName?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    ''

  const { data: myMembership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { count: memberCount } = await supabase
    .from('organization_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('organization_id', org.id)

  const initial: SettingsInitialData = {
    organizationId: org.id,
    businessName: org.name,
    businessType: org.business_type,
    currency: org.currency as CurrencyCode,
    usesStock: org.uses_stock,
    onboardingProfile: profile,
    email: user.email ?? '—',
    preferredName,
    myRole: (myMembership?.role as string | null) ?? null,
    memberCount: memberCount ?? null,
  }

  return (
    <AjustesShell>
      <AppMain>
        <SettingsClient initial={initial} />
      </AppMain>
    </AjustesShell>
  )
}
