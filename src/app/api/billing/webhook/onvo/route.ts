import { NextResponse } from 'next/server'
import { activateOrganizationSubscription } from '@/lib/billing/activate-subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BillingCycle } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 500 })
  }

  const payload = await request.json().catch(() => ({}))
  const meta = (payload.metadata ?? payload.data?.metadata ?? {}) as Record<string, string>
  const status = String(payload.status ?? payload.data?.status ?? '').toLowerCase()
  const succeeded =
    status === 'succeeded' ||
    status === 'paid' ||
    status === 'completed' ||
    payload.type === 'payment.succeeded'

  if (!succeeded || !meta.organization_id) {
    return NextResponse.json({ received: true })
  }

  const planId = (meta.plan_id ?? 'profesional') as SubscriptionPlanId
  const cycle = (meta.billing_cycle ?? 'annual') as BillingCycle

  try {
    await activateOrganizationSubscription(admin, {
      organizationId: meta.organization_id,
      planId,
      billingCycle: cycle,
      paymentProvider: 'onvo',
      checkoutId: meta.checkout_id ?? null,
      customerId: typeof payload.customerId === 'string' ? payload.customerId : null,
    })
  } catch (e) {
    console.error('onvo webhook activate', e)
    return NextResponse.json({ error: 'activate_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
