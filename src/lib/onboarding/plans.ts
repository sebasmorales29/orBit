export type SubscriptionPlanId = 'operativo' | 'profesional' | 'equipo'

export const SUBSCRIPTION_PLAN_IDS: SubscriptionPlanId[] = [
  'operativo',
  'profesional',
  'equipo',
]

/** Precio mensual de referencia (USD) para MRR en ops. */
export const PLAN_MONTHLY_USD: Record<SubscriptionPlanId, number> = {
  operativo: 38,
  profesional: 49,
  equipo: 68,
}

export function planToTier(plan: SubscriptionPlanId): 'starter' | 'pro' | 'enterprise' {
  switch (plan) {
    case 'operativo':
      return 'starter'
    case 'profesional':
      return 'pro'
    case 'equipo':
      return 'enterprise'
    default:
      return 'starter'
  }
}

export function planToMonthlyFeeCents(plan: SubscriptionPlanId): number {
  return PLAN_MONTHLY_USD[plan] * 100
}
