import type { SupabaseClient } from '@supabase/supabase-js'
import { addBillingPeriod } from '@/lib/billing/period'
import { checkoutAmountCents } from '@/lib/billing/pricing'
import type { BillingCycle, BillingPurpose, PendingBillingAction } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { planToMonthlyFeeCents, planToTier } from '@/lib/onboarding/plans'

async function recordBillingEvent(
  admin: SupabaseClient,
  input: {
    organizationId: string
    eventType: string
    planId: SubscriptionPlanId
    billingCycle: BillingCycle
    amountCents: number
    paymentProvider: string
    checkoutId?: string | null
    status?: string
    metadata?: Record<string, unknown>
  }
) {
  await admin.from('billing_events').insert({
    organization_id: input.organizationId,
    event_type: input.eventType,
    plan_id: input.planId,
    billing_cycle: input.billingCycle,
    amount_cents: input.amountCents,
    currency: 'USD',
    payment_provider: input.paymentProvider,
    payment_checkout_id: input.checkoutId ?? null,
    status: input.status ?? 'succeeded',
    metadata: input.metadata ?? {},
  })
}

export async function finalizeBillingPayment(
  admin: SupabaseClient,
  input: {
    organizationId: string
    planId: SubscriptionPlanId
    billingCycle: BillingCycle
    paymentProvider: string
    checkoutId?: string | null
    customerId?: string | null
    purpose?: BillingPurpose
    amountCents?: number
    pendingAction?: PendingBillingAction | null
  }
) {
  const purpose = input.purpose ?? input.pendingAction?.purpose ?? 'activation'
  const amountCents =
    input.amountCents ??
    input.pendingAction?.amountCents ??
    checkoutAmountCents(input.planId, input.billingCycle)

  const { data: org } = await admin
    .from('organizations')
    .select('subscription_activated_at, subscription_current_period_end')
    .eq('id', input.organizationId)
    .maybeSingle()

  const now = new Date()

  if (purpose === 'update_card') {
    const { error } = await admin
      .from('organizations')
      .update({
        payment_customer_id: input.customerId ?? null,
        pending_billing_action: null,
        subscription_status: 'active',
        platform_status: 'active',
      })
      .eq('id', input.organizationId)
    if (error) throw error

    await recordBillingEvent(admin, {
      organizationId: input.organizationId,
      eventType: 'card_update',
      planId: input.planId,
      billingCycle: input.billingCycle,
      amountCents: 0,
      paymentProvider: input.paymentProvider,
      checkoutId: input.checkoutId,
    })
    return
  }

  let periodStart = now
  if (purpose === 'renewal' && org?.subscription_current_period_end) {
    const previousEnd = new Date(org.subscription_current_period_end)
    periodStart = previousEnd > now ? previousEnd : now
  }

  const periodEnd = addBillingPeriod(periodStart, input.billingCycle)

  const updatePayload: Record<string, unknown> = {
    subscription_status: 'active',
    platform_status: 'active',
    onboarding_completed: true,
    selected_plan: input.planId,
    plan_tier: planToTier(input.planId),
    monthly_fee_cents: planToMonthlyFeeCents(input.planId),
    billing_cycle: input.billingCycle,
    billing_amount_cents: amountCents,
    payment_provider: input.paymentProvider,
    subscription_current_period_start: periodStart.toISOString(),
    subscription_current_period_end: periodEnd.toISOString(),
    subscription_next_billing_at: periodEnd.toISOString(),
    subscription_cancel_at_period_end: false,
    subscription_scheduled_plan: null,
    subscription_scheduled_cycle: null,
    pending_billing_action: null,
  }

  if (!org?.subscription_activated_at) {
    updatePayload.subscription_activated_at = now.toISOString()
  }

  if (input.checkoutId) updatePayload.payment_checkout_id = input.checkoutId
  if (input.customerId) updatePayload.payment_customer_id = input.customerId

  const { error } = await admin
    .from('organizations')
    .update(updatePayload)
    .eq('id', input.organizationId)

  if (error) throw error

  const eventType =
    purpose === 'renewal'
      ? 'renewal'
      : purpose === 'change'
        ? input.pendingAction?.previousPlanId !== input.planId
          ? 'plan_change'
          : 'cycle_change'
        : 'activation'

  await recordBillingEvent(admin, {
    organizationId: input.organizationId,
    eventType,
    planId: input.planId,
    billingCycle: input.billingCycle,
    amountCents,
    paymentProvider: input.paymentProvider,
    checkoutId: input.checkoutId,
    metadata: {
      purpose,
      previousPlanId: input.pendingAction?.previousPlanId ?? null,
      previousCycle: input.pendingAction?.previousCycle ?? null,
    },
  })
}

export async function markSubscriptionPastDue(admin: SupabaseClient, organizationId: string) {
  await admin
    .from('organizations')
    .update({ subscription_status: 'past_due', platform_status: 'suspended' })
    .eq('id', organizationId)

  await admin.from('billing_events').insert({
    organization_id: organizationId,
    event_type: 'payment_failed',
    status: 'failed',
    metadata: {},
  })
}

export async function cancelSubscriptionAtPeriodEnd(
  admin: SupabaseClient,
  organizationId: string
) {
  const { error } = await admin
    .from('organizations')
    .update({ subscription_cancel_at_period_end: true })
    .eq('id', organizationId)
  if (error) throw error

  await admin.from('billing_events').insert({
    organization_id: organizationId,
    event_type: 'canceled',
    status: 'scheduled',
    metadata: { mode: 'at_period_end' },
  })
}

export async function reactivateSubscription(admin: SupabaseClient, organizationId: string) {
  const { error } = await admin
    .from('organizations')
    .update({
      subscription_cancel_at_period_end: false,
      subscription_status: 'active',
      platform_status: 'active',
    })
    .eq('id', organizationId)
  if (error) throw error

  await admin.from('billing_events').insert({
    organization_id: organizationId,
    event_type: 'reactivated',
    status: 'succeeded',
    metadata: {},
  })
}

export async function scheduleSubscriptionChange(
  admin: SupabaseClient,
  input: {
    organizationId: string
    planId: SubscriptionPlanId
    billingCycle: BillingCycle
    currentPlan: SubscriptionPlanId
    currentCycle: BillingCycle
  }
) {
  const { error } = await admin
    .from('organizations')
    .update({
      subscription_scheduled_plan:
        input.planId !== input.currentPlan ? input.planId : null,
      subscription_scheduled_cycle:
        input.billingCycle !== input.currentCycle ? input.billingCycle : null,
      subscription_cancel_at_period_end: false,
    })
    .eq('id', input.organizationId)

  if (error) throw error

  await recordBillingEvent(admin, {
    organizationId: input.organizationId,
    eventType: 'scheduled_change',
    planId: input.planId,
    billingCycle: input.billingCycle,
    amountCents: 0,
    paymentProvider: 'internal',
    status: 'scheduled',
    metadata: {
      previousPlanId: input.currentPlan,
      previousCycle: input.currentCycle,
    },
  })
}

export async function expireCanceledSubscription(admin: SupabaseClient, organizationId: string) {
  const { error } = await admin
    .from('organizations')
    .update({
      subscription_status: 'canceled',
      platform_status: 'suspended',
      subscription_cancel_at_period_end: false,
    })
    .eq('id', organizationId)
  if (error) throw error
}
