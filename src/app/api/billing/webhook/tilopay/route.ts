import { NextResponse } from 'next/server'
import { activateOrganizationSubscription } from '@/lib/billing/activate-subscription'
import { checkoutAmountCents } from '@/lib/billing/pricing'
import {
  getTilopayCredentials,
  verifyTilopayOrderHash,
} from '@/lib/billing/tilopay'
import type { BillingCycle, PendingBillingAction } from '@/lib/billing/types'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'

interface TilopayWebhookBody {
  orderNumber?: string
  code?: number | string
  orderHash?: string
  tpt?: string
  auth?: string
  crd?: string
  email?: string
}

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 500 })
  }

  const creds = getTilopayCredentials()
  if (!creds) {
    return NextResponse.json({ error: 'tilopay_not_configured' }, { status: 500 })
  }

  const payload = (await request.json().catch(() => ({}))) as TilopayWebhookBody
  const orderNumber = payload.orderNumber?.trim()
  const code = payload.code
  const orderHash = payload.orderHash?.trim()
  const tpayOrderId = payload.tpt?.trim()
  const auth = payload.auth?.trim()

  if (!orderNumber || code === undefined || !orderHash || !tpayOrderId || !auth) {
    return NextResponse.json({ received: true, skipped: 'incomplete_payload' })
  }

  const { data: org } = await admin
    .from('organizations')
    .select(
      'id, subscription_status, selected_plan, billing_cycle, payment_checkout_id, subscription_owner_id, pending_billing_action'
    )
    .eq('payment_checkout_id', orderNumber)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: 'organization_not_found' }, { status: 404 })
  }

  const pendingAction = (org.pending_billing_action ?? null) as PendingBillingAction | null
  if (org.subscription_status === 'active' && !pendingAction) {
    return NextResponse.json({ received: true, already_active: true })
  }

  const planId = (pendingAction?.planId ?? org.selected_plan ?? 'profesional') as SubscriptionPlanId
  const cycle = (pendingAction?.billingCycle ?? org.billing_cycle ?? 'annual') as BillingCycle
  const amount = (pendingAction?.amountCents ?? checkoutAmountCents(planId, cycle)) / 100

  let email = payload.email?.trim() ?? ''
  if (!email && org.subscription_owner_id) {
    const { data: owner } = await admin.auth.admin.getUserById(org.subscription_owner_id)
    email = owner?.user?.email ?? ''
  }

  if (!email) {
    return NextResponse.json({ error: 'missing_email' }, { status: 400 })
  }

  const hashOk = verifyTilopayOrderHash({
    creds,
    orderNumber,
    amount,
    currency: 'USD',
    tpayOrderId,
    responseCode: code,
    auth,
    email,
    orderHash,
  })

  if (!hashOk) {
    return NextResponse.json({ error: 'invalid_hash' }, { status: 400 })
  }

  if (String(code) !== '1') {
    return NextResponse.json({ received: true, payment_not_approved: true })
  }

  try {
    await activateOrganizationSubscription(admin, {
      organizationId: org.id,
      planId,
      billingCycle: cycle,
      paymentProvider: 'tilopay',
      checkoutId: orderNumber,
      customerId: payload.crd ?? null,
      purpose: pendingAction?.purpose ?? 'activation',
      pendingAction,
    })
  } catch (e) {
    console.error('tilopay webhook activate', e)
    return NextResponse.json({ error: 'activate_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true, activated: true })
}
