import type { SubscriptionPlanId } from '@/lib/onboarding/plans'

export type BillingProviderId = 'onvo' | 'tilopay' | 'simulated'

export type BillingCycle = 'monthly' | 'semiannual' | 'annual'

export type SubscriptionStatus = 'pending_payment' | 'active' | 'past_due' | 'canceled'

export type BillingPurpose = 'activation' | 'change' | 'renewal' | 'update_card'

export type BillingChangeTiming = 'immediate' | 'at_renewal'

export interface PendingBillingAction {
  purpose: BillingPurpose
  planId: SubscriptionPlanId
  billingCycle: BillingCycle
  amountCents: number
  previousPlanId?: SubscriptionPlanId
  previousCycle?: BillingCycle
}

export interface SubscriptionSnapshot {
  organizationId: string
  status: SubscriptionStatus
  planId: SubscriptionPlanId
  billingCycle: BillingCycle
  amountCents: number
  perMonthUsd: number
  periodStart: string | null
  periodEnd: string | null
  nextBillingAt: string | null
  cancelAtPeriodEnd: boolean
  scheduledPlanId: SubscriptionPlanId | null
  scheduledCycle: BillingCycle | null
  paymentProvider: string | null
  hasPaymentMethod: boolean
  isOwner: boolean
  events: BillingEventRow[]
}

export interface BillingEventRow {
  id: string
  event_type: string
  plan_id: string | null
  billing_cycle: string | null
  amount_cents: number | null
  status: string
  created_at: string
}

export interface CheckoutLineItem {
  planId: SubscriptionPlanId
  planName: string
  cycle: BillingCycle
  amountCents: number
  currency: 'USD'
  perMonthUsd: number
  description: string
}

export interface CreateCheckoutInput {
  organizationId: string
  userId: string
  userEmail: string
  businessName: string
  lineItem: CheckoutLineItem
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutResult {
  ok: true
  provider: BillingProviderId
  checkoutUrl: string
  checkoutId: string
}

export type CreateCheckoutError = {
  ok: false
  message: string
  code: 'NOT_CONFIGURED' | 'PROVIDER_ERROR'
}
