import type { SupabaseClient } from '@supabase/supabase-js'
import { finalizeBillingPayment } from '@/lib/billing/finalize-payment'
import type { BillingCycle, PendingBillingAction } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'

export async function activateOrganizationSubscription(
  admin: SupabaseClient,
  input: {
    organizationId: string
    planId: SubscriptionPlanId
    billingCycle: BillingCycle
    paymentProvider: string
    checkoutId?: string | null
    customerId?: string | null
    purpose?: 'activation' | 'change' | 'renewal' | 'update_card'
    pendingAction?: PendingBillingAction | null
  }
) {
  await finalizeBillingPayment(admin, {
    organizationId: input.organizationId,
    planId: input.planId,
    billingCycle: input.billingCycle,
    paymentProvider: input.paymentProvider,
    checkoutId: input.checkoutId,
    customerId: input.customerId,
    purpose: input.purpose ?? 'activation',
    pendingAction: input.pendingAction,
  })
}
