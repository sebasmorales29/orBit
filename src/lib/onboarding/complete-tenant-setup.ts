import type { SupabaseClient, User } from '@supabase/supabase-js'
import { ensureDefaultTenantDashboard } from '@/lib/dashboard/tenant-dashboards'
import { dashboardLayoutFromProfile } from '@/lib/onboarding/personalization'
import { planToMonthlyFeeCents, planToTier } from '@/lib/onboarding/plans'
import { templatesForVertical } from '@/lib/onboarding/seed-templates'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import { bootstrapOrganization } from '@/lib/onboarding/bootstrap-organization'
import type { CurrencyCode } from '@/types/database'
import type { TenantBrandTheme } from '@/lib/onboarding/brand-theme'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
export type CompleteTenantSetupInput = {
  businessName: string
  businessTypeLabel: string
  businessTypeKey: string
  currency: CurrencyCode
  usesStock: boolean
  profile: OnboardingProfile
  brandTheme: TenantBrandTheme
  selectedPlan: SubscriptionPlanId
}

export type CompleteTenantSetupResult =
  | { ok: true; organizationId: string }
  | { ok: false; reason: string; message?: string }

export async function completeTenantSetup(
  supabase: SupabaseClient,
  user: User,
  input: CompleteTenantSetupInput,
  defaultDashboardName: string
): Promise<CompleteTenantSetupResult> {
  let orgId: string

  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existingMember?.organization_id) {
    orgId = existingMember.organization_id
  } else {
    const result = await bootstrapOrganization(supabase, user, {
      name: input.businessName.trim(),
      businessType: input.businessTypeLabel,
      currency: input.currency,
      usesStock: input.usesStock,
    })
    if (!result.ok) {
      return { ok: false, reason: result.reason, message: result.message }
    }
    orgId = result.organizationId
  }

  const layout = dashboardLayoutFromProfile(input.profile, input.usesStock)

  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      name: input.businessName.trim(),
      business_type: input.businessTypeLabel,
      currency: input.currency,
      uses_stock: input.usesStock,
      onboarding_profile: input.profile,
      onboarding_completed: false,
      subscription_status: 'pending_payment',
      subscription_owner_id: user.id,
      provisioned_source: 'self_service',
      selected_plan: input.selectedPlan,
      plan_tier: planToTier(input.selectedPlan),
      monthly_fee_cents: planToMonthlyFeeCents(input.selectedPlan),
      platform_status: 'trial',
      brand_theme: input.brandTheme,
    })
    .eq('id', orgId)

  if (orgError) {
    return { ok: false, reason: 'failed', message: orgError.message }
  }

  await supabase
    .from('organization_members')
    .update({ dashboard_layout: layout })
    .eq('organization_id', orgId)
    .eq('user_id', user.id)

  await supabase.from('message_templates').delete().eq('organization_id', orgId)
  await supabase.from('message_templates').insert(
    templatesForVertical(input.businessTypeKey).map((tpl) => ({
      organization_id: orgId,
      name: tpl.name,
      category: tpl.category,
      content: tpl.content,
    }))
  )

  await ensureDefaultTenantDashboard(supabase, {
    organizationId: orgId,
    userId: user.id,
    usesStock: input.usesStock,
    fallbackLayout: layout,
    defaultName: defaultDashboardName,
  })

  if (input.profile.preferredName !== user.user_metadata?.full_name) {
    void supabase.auth.updateUser({
      data: { full_name: input.profile.preferredName },
    })
  }

  return { ok: true, organizationId: orgId }
}
