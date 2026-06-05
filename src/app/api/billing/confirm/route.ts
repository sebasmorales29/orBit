import { NextResponse } from 'next/server'
import { verifyCheckoutToken } from '@/lib/billing/checkout'
import { activateOrganizationSubscription } from '@/lib/billing/activate-subscription'
import type { BillingCycle, PendingBillingAction } from '@/lib/billing/types'
import {
  getTilopayCredentials,
  parseTilopayReturnParams,
  verifyTilopayOrderHash,
} from '@/lib/billing/tilopay'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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

function billingPaths(pending: PendingBillingAction | null, subscriptionStatus: string) {
  const fromSettings =
    pending?.purpose === 'change' ||
    pending?.purpose === 'update_card' ||
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'past_due'

  return {
    success: fromSettings
      ? '/ajustes?view=facturacion&billing=success'
      : '/onboarding/exito',
    canceled: fromSettings
      ? '/ajustes?view=facturacion&canceled=1'
      : '/onboarding?step=8&canceled=1',
    error: (code: string) =>
      fromSettings
        ? `/ajustes?view=facturacion&error=${code}`
        : `/onboarding?step=8&error=${code}`,
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const tilopayReturn = parseTilopayReturnParams(url.searchParams)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${appBase}/login?next=/onboarding`)
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.redirect(`${appBase}/onboarding/exito?error=config`)
  }

  let organizationId: string | null = null
  let checkoutId: string | null = null

  if (token) {
    const verified = verifyCheckoutToken(token)
    if (!verified || verified.userId !== user.id) {
      return NextResponse.redirect(`${appBase}/onboarding?step=8&error=token`)
    }
    organizationId = verified.organizationId
    checkoutId = verified.checkoutId
  } else if (tilopayReturn.orderNumber) {
    checkoutId = tilopayReturn.orderNumber
    const { data: orgByCheckout } = await admin
      .from('organizations')
      .select('id, subscription_owner_id')
      .eq('payment_checkout_id', checkoutId)
      .maybeSingle()

    if (!orgByCheckout) {
      return NextResponse.redirect(`${appBase}/onboarding?step=8&error=checkout`)
    }
    if (orgByCheckout.subscription_owner_id && orgByCheckout.subscription_owner_id !== user.id) {
      return NextResponse.redirect(`${appBase}/onboarding?step=8&error=owner`)
    }
    organizationId = orgByCheckout.id
  } else {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    organizationId = membership?.organization_id ?? null
  }

  if (!organizationId) {
    return NextResponse.redirect(`${appBase}/onboarding`)
  }

  const { data: org } = await admin
    .from('organizations')
    .select(
      'id, subscription_status, selected_plan, billing_cycle, payment_provider, payment_checkout_id, subscription_owner_id, pending_billing_action'
    )
    .eq('id', organizationId)
    .maybeSingle()

  if (!org) {
    return NextResponse.redirect(`${appBase}/onboarding`)
  }

  const pending = (org.pending_billing_action ?? null) as PendingBillingAction | null
  const paths = billingPaths(pending, org.subscription_status ?? 'pending_payment')

  if (tilopayReturn.canceled) {
    return NextResponse.redirect(`${appBase}${paths.canceled}`)
  }

  if (org.subscription_owner_id && org.subscription_owner_id !== user.id) {
    return NextResponse.redirect(`${appBase}${paths.error('owner')}`)
  }

  const resolvedCheckoutId = checkoutId ?? org.payment_checkout_id
  const planId = pending?.planId ?? asPlanId(org.selected_plan)
  const cycle = pending?.billingCycle ?? asCycle(org.billing_cycle)
  const amountCents = pending?.amountCents ?? 0

  if (
    org.subscription_status === 'active' &&
    !pending &&
    !tilopayReturn.code
  ) {
    return NextResponse.redirect(`${appBase}${paths.success}`)
  }

  const hasTilopayReturn =
    tilopayReturn.code !== null &&
    tilopayReturn.orderNumber !== null &&
    tilopayReturn.orderHash !== null &&
    tilopayReturn.tpayOrderId !== null &&
    tilopayReturn.auth !== null

  if (hasTilopayReturn) {
    const creds = getTilopayCredentials()
    if (!creds) {
      return NextResponse.redirect(`${appBase}${paths.error('config')}`)
    }

    if (tilopayReturn.orderNumber !== resolvedCheckoutId) {
      return NextResponse.redirect(`${appBase}${paths.error('checkout')}`)
    }

    const email = user.email ?? ''
    const hashOk = verifyTilopayOrderHash({
      creds,
      orderNumber: tilopayReturn.orderNumber!,
      amount: amountCents / 100,
      currency: 'USD',
      tpayOrderId: tilopayReturn.tpayOrderId!,
      responseCode: tilopayReturn.code!,
      auth: tilopayReturn.auth!,
      email,
      orderHash: tilopayReturn.orderHash!,
    })

    if (!hashOk) {
      return NextResponse.redirect(`${appBase}${paths.error('hash')}`)
    }

    if (tilopayReturn.code !== '1') {
      return NextResponse.redirect(`${appBase}${paths.error('payment')}`)
    }

    try {
      await activateOrganizationSubscription(admin, {
        organizationId: org.id,
        planId,
        billingCycle: cycle,
        paymentProvider: 'tilopay',
        checkoutId: resolvedCheckoutId,
        customerId: tilopayReturn.cardToken,
        purpose: pending?.purpose ?? 'activation',
        pendingAction: pending,
      })
    } catch {
      return NextResponse.redirect(`${appBase}${paths.error('activate')}`)
    }

    return NextResponse.redirect(`${appBase}${paths.success}`)
  }

  const isSimulated =
    org.payment_provider === 'simulated' ||
    (!getTilopayCredentials() && !process.env.ONVO_SECRET_KEY?.trim())

  if (!isSimulated) {
    return NextResponse.redirect(`${appBase}${paths.error('payment')}`)
  }

  try {
    await activateOrganizationSubscription(admin, {
      organizationId: org.id,
      planId,
      billingCycle: cycle,
      paymentProvider: org.payment_provider ?? 'simulated',
      checkoutId: resolvedCheckoutId,
      purpose: pending?.purpose ?? 'activation',
      pendingAction: pending,
    })
  } catch {
    return NextResponse.redirect(`${appBase}${paths.error('activate')}`)
  }

  return NextResponse.redirect(`${appBase}${paths.success}`)
}
