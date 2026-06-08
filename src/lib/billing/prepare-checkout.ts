import crypto from 'crypto'
import { checkoutAmountCents, pricePerMonthUsd } from '@/lib/billing/pricing'
import { createBillingCheckout, signCheckoutToken } from '@/lib/billing/checkout'
import type {
  BillingChangeTiming,
  BillingCycle,
  BillingPurpose,
  PendingBillingAction,
} from '@/lib/billing/types'
import { resolveChangeTiming } from '@/lib/billing/subscription-policy'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { SUBSCRIPTION_PLAN_IDS } from '@/lib/onboarding/plans'

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

export async function prepareBillingCheckout(
  admin: SupabaseClient,
  input: {
    organizationId: string
    userId: string
    userEmail: string
    businessName: string
    planId: SubscriptionPlanId
    billingCycle: BillingCycle
    purpose: BillingPurpose
    timing?: BillingChangeTiming
    successPath?: string
    cancelPath?: string
    currentPlan?: SubscriptionPlanId
    currentCycle?: BillingCycle
    forceImmediate?: boolean
  }
) {
  const amountCents = checkoutAmountCents(input.planId, input.billingCycle)
  const perMonthUsd = pricePerMonthUsd(input.planId, input.billingCycle)
  const checkoutId = `chk_${crypto.randomUUID().replace(/-/g, '')}`

  const pendingAction: PendingBillingAction = {
    purpose: input.purpose,
    planId: input.planId,
    billingCycle: input.billingCycle,
    amountCents,
    previousPlanId: input.currentPlan,
    previousCycle: input.currentCycle,
  }

  const confirmToken = signCheckoutToken({
    organizationId: input.organizationId,
    userId: input.userId,
    checkoutId,
    exp: Date.now() + 60 * 60 * 1000,
  })

  const successUrl = `${appBase()}${input.successPath ?? '/api/billing/confirm'}?token=${encodeURIComponent(confirmToken)}`
  const cancelUrl = `${appBase()}${input.cancelPath ?? '/onboarding?step=8&canceled=1'}`

  const checkout = await createBillingCheckout({
    organizationId: input.organizationId,
    userId: input.userId,
    userEmail: input.userEmail,
    businessName: input.businessName,
    lineItem: {
      planId: input.planId,
      planName: input.planId,
      cycle: input.billingCycle,
      amountCents,
      currency: 'USD',
      perMonthUsd,
      description: `Velum ${input.planId} · ${input.billingCycle}`,
    },
    successUrl,
    cancelUrl,
  })

  if (!checkout.ok) {
    return { ok: false as const, message: checkout.message }
  }

  await admin
    .from('organizations')
    .update({
      billing_cycle: input.billingCycle,
      payment_provider: checkout.provider,
      payment_checkout_id: checkout.checkoutId,
      pending_billing_action: pendingAction,
    })
    .eq('id', input.organizationId)

  return {
    ok: true as const,
    checkoutUrl: checkout.checkoutUrl,
    provider: checkout.provider,
    amountCents,
    perMonthUsd,
    checkoutId: checkout.checkoutId,
    timing: 'immediate' as const,
  }
}

export function validatePlanCycle(planId?: string, billingCycle?: string) {
  if (!planId || !SUBSCRIPTION_PLAN_IDS.includes(planId as SubscriptionPlanId)) {
    return { ok: false as const, message: 'Plan inválido.' }
  }
  if (!billingCycle || !['monthly', 'semiannual', 'annual'].includes(billingCycle)) {
    return { ok: false as const, message: 'Ciclo de facturación inválido.' }
  }
  return {
    ok: true as const,
    planId: planId as SubscriptionPlanId,
    billingCycle: billingCycle as BillingCycle,
  }
}

export function resolveCheckoutTiming(input: {
  purpose: BillingPurpose
  currentPlan: SubscriptionPlanId
  currentCycle: BillingCycle
  nextPlan: SubscriptionPlanId
  nextCycle: BillingCycle
  requestedTiming?: BillingChangeTiming
  subscriptionStatus: string
}) {
  if (input.purpose === 'activation' || input.purpose === 'update_card') {
    return 'immediate' as BillingChangeTiming
  }

  return resolveChangeTiming({
    currentPlan: input.currentPlan,
    currentCycle: input.currentCycle,
    nextPlan: input.nextPlan,
    nextCycle: input.nextCycle,
    requestedTiming: input.requestedTiming,
    forceImmediate: input.subscriptionStatus === 'past_due',
  })
}
