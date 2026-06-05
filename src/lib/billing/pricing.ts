import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { PLAN_MONTHLY_USD } from '@/lib/onboarding/plans'
import type { BillingCycle } from '@/lib/billing/types'

const CYCLE_FACTOR: Record<BillingCycle, number> = {
  monthly: 1,
  semiannual: 0.88,
  annual: 0.82,
}

export function pricePerMonthUsd(plan: SubscriptionPlanId, cycle: BillingCycle): number {
  return Math.round(PLAN_MONTHLY_USD[plan] * CYCLE_FACTOR[cycle])
}

export function checkoutAmountCents(plan: SubscriptionPlanId, cycle: BillingCycle): number {
  const perMonth = pricePerMonthUsd(plan, cycle)
  const months = cycle === 'monthly' ? 1 : cycle === 'semiannual' ? 6 : 12
  return perMonth * months * 100
}

export function cycleLabelKey(cycle: BillingCycle): string {
  return `billing.cycle.${cycle}`
}
