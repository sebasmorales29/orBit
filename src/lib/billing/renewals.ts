import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkoutAmountCents } from '@/lib/billing/pricing'
import {
  expireCanceledSubscription,
  finalizeBillingPayment,
  markSubscriptionPastDue,
} from '@/lib/billing/finalize-payment'
import type { BillingCycle, PendingBillingAction } from '@/lib/billing/types'
import { processTilopayRecurrentPayment } from '@/lib/billing/tilopay'
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

export async function processDueSubscriptionRenewals(admin: SupabaseClient) {
  const nowIso = new Date().toISOString()

  const { data: dueOrgs, error } = await admin
    .from('organizations')
    .select(
      'id, name, selected_plan, billing_cycle, billing_amount_cents, payment_provider, payment_customer_id, subscription_owner_id, subscription_cancel_at_period_end, subscription_scheduled_plan, subscription_scheduled_cycle, subscription_status'
    )
    .in('subscription_status', ['active', 'past_due'])
    .lte('subscription_next_billing_at', nowIso)

  if (error) throw error

  const results: Array<{ organizationId: string; ok: boolean; message: string }> = []

  for (const org of dueOrgs ?? []) {
    try {
      if (org.subscription_cancel_at_period_end) {
        await expireCanceledSubscription(admin, org.id)
        results.push({ organizationId: org.id, ok: true, message: 'canceled_at_period_end' })
        continue
      }

      const planId = asPlanId(org.subscription_scheduled_plan ?? org.selected_plan)
      const billingCycle = asCycle(org.subscription_scheduled_cycle ?? org.billing_cycle)
      const amountCents = checkoutAmountCents(planId, billingCycle)
      const checkoutId = `rnw_${crypto.randomUUID().replace(/-/g, '')}`

      let ownerEmail = ''
      if (org.subscription_owner_id) {
        const { data: owner } = await admin.auth.admin.getUserById(org.subscription_owner_id)
        ownerEmail = owner?.user?.email ?? ''
      }

      const pendingAction: PendingBillingAction = {
        purpose: 'renewal',
        planId,
        billingCycle,
        amountCents,
        previousPlanId: asPlanId(org.selected_plan),
        previousCycle: asCycle(org.billing_cycle),
      }

      if (org.payment_provider === 'tilopay' && org.payment_customer_id && ownerEmail) {
        const charge = await processTilopayRecurrentPayment({
          cardToken: org.payment_customer_id,
          amount: amountCents / 100,
          currency: 'USD',
          email: ownerEmail,
          orderNumber: checkoutId,
        })

        if (!charge.ok) {
          await markSubscriptionPastDue(admin, org.id)
          results.push({ organizationId: org.id, ok: false, message: charge.message })
          continue
        }
      } else if (org.payment_provider === 'simulated' || process.env.NODE_ENV === 'development') {
        // Dev / simulated: auto-renew without card
      } else {
        await markSubscriptionPastDue(admin, org.id)
        results.push({
          organizationId: org.id,
          ok: false,
          message: 'missing_payment_method',
        })
        continue
      }

      await finalizeBillingPayment(admin, {
        organizationId: org.id,
        planId,
        billingCycle,
        paymentProvider: org.payment_provider ?? 'simulated',
        checkoutId,
        customerId: org.payment_customer_id,
        purpose: 'renewal',
        amountCents,
        pendingAction,
      })

      results.push({ organizationId: org.id, ok: true, message: 'renewed' })
    } catch (e) {
      results.push({
        organizationId: org.id,
        ok: false,
        message: e instanceof Error ? e.message : 'renewal_error',
      })
    }
  }

  return results
}
