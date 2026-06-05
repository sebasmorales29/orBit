import type { BillingChangeTiming, BillingCycle } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'

const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  operativo: 1,
  profesional: 2,
  equipo: 3,
}

const CYCLE_RANK: Record<BillingCycle, number> = {
  monthly: 1,
  semiannual: 2,
  annual: 3,
}

export function isPlanUpgrade(
  current: SubscriptionPlanId,
  next: SubscriptionPlanId
): boolean {
  return PLAN_RANK[next] > PLAN_RANK[current]
}

export function isPlanDowngrade(
  current: SubscriptionPlanId,
  next: SubscriptionPlanId
): boolean {
  return PLAN_RANK[next] < PLAN_RANK[current]
}

export function isCycleUpgrade(current: BillingCycle, next: BillingCycle): boolean {
  return CYCLE_RANK[next] > CYCLE_RANK[current]
}

export function isCycleDowngrade(current: BillingCycle, next: BillingCycle): boolean {
  return CYCLE_RANK[next] < CYCLE_RANK[current]
}

export function resolveChangeTiming(input: {
  currentPlan: SubscriptionPlanId
  currentCycle: BillingCycle
  nextPlan: SubscriptionPlanId
  nextCycle: BillingCycle
  requestedTiming?: BillingChangeTiming
  forceImmediate?: boolean
}): BillingChangeTiming {
  if (input.forceImmediate) return 'immediate'

  const planChanged = input.currentPlan !== input.nextPlan
  const cycleChanged = input.currentCycle !== input.nextCycle

  if (!planChanged && !cycleChanged) return 'immediate'

  if (planChanged && isPlanDowngrade(input.currentPlan, input.nextPlan)) {
    return 'at_renewal'
  }

  if (cycleChanged && isCycleDowngrade(input.currentCycle, input.nextCycle)) {
    return 'at_renewal'
  }

  if (input.requestedTiming === 'at_renewal') {
    return 'at_renewal'
  }

  return 'immediate'
}

export function hasScheduledChange(input: {
  scheduledPlan: SubscriptionPlanId | null
  scheduledCycle: BillingCycle | null
  currentPlan: SubscriptionPlanId
  currentCycle: BillingCycle
}): boolean {
  if (input.scheduledPlan && input.scheduledPlan !== input.currentPlan) return true
  if (input.scheduledCycle && input.scheduledCycle !== input.currentCycle) return true
  return false
}
