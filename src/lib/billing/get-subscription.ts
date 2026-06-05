import type { SupabaseClient } from '@supabase/supabase-js'
import { checkoutAmountCents, pricePerMonthUsd } from '@/lib/billing/pricing'
import type { BillingCycle, SubscriptionSnapshot } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { SUBSCRIPTION_PLAN_IDS } from '@/lib/onboarding/plans'

function asPlanId(value: string | null | undefined): SubscriptionPlanId {
  if (value && SUBSCRIPTION_PLAN_IDS.includes(value as SubscriptionPlanId)) {
    return value as SubscriptionPlanId
  }
  return 'profesional'
}

function asCycle(value: string | null | undefined): BillingCycle {
  if (value === 'monthly' || value === 'semiannual' || value === 'annual') return value
  return 'annual'
}

export async function getSubscriptionSnapshot(
  admin: SupabaseClient,
  input: { organizationId: string; userId: string }
): Promise<SubscriptionSnapshot | null> {
  const { data: org } = await admin
    .from('organizations')
    .select(
      'id, subscription_status, selected_plan, billing_cycle, billing_amount_cents, subscription_current_period_start, subscription_current_period_end, subscription_next_billing_at, subscription_cancel_at_period_end, subscription_scheduled_plan, subscription_scheduled_cycle, payment_provider, payment_customer_id, subscription_owner_id'
    )
    .eq('id', input.organizationId)
    .maybeSingle()

  if (!org) return null

  const planId = asPlanId(org.selected_plan)
  const billingCycle = asCycle(org.billing_cycle)
  const amountCents =
    org.billing_amount_cents ?? checkoutAmountCents(planId, billingCycle)

  const { data: events } = await admin
    .from('billing_events')
    .select('id, event_type, plan_id, billing_cycle, amount_cents, status, created_at')
    .eq('organization_id', input.organizationId)
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    organizationId: org.id,
    status: (org.subscription_status ?? 'pending_payment') as SubscriptionSnapshot['status'],
    planId,
    billingCycle,
    amountCents,
    perMonthUsd: pricePerMonthUsd(planId, billingCycle),
    periodStart: org.subscription_current_period_start,
    periodEnd: org.subscription_current_period_end,
    nextBillingAt: org.subscription_next_billing_at,
    cancelAtPeriodEnd: org.subscription_cancel_at_period_end ?? false,
    scheduledPlanId: org.subscription_scheduled_plan
      ? asPlanId(org.subscription_scheduled_plan)
      : null,
    scheduledCycle: org.subscription_scheduled_cycle
      ? asCycle(org.subscription_scheduled_cycle)
      : null,
    paymentProvider: org.payment_provider,
    hasPaymentMethod: Boolean(org.payment_customer_id),
    isOwner: !org.subscription_owner_id || org.subscription_owner_id === input.userId,
    events: events ?? [],
  }
}
