import { NextResponse } from 'next/server'
import {
  prepareBillingCheckout,
  resolveCheckoutTiming,
  validatePlanCycle,
} from '@/lib/billing/prepare-checkout'
import { scheduleSubscriptionChange } from '@/lib/billing/finalize-payment'
import type { BillingChangeTiming, BillingPurpose } from '@/lib/billing/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { SUBSCRIPTION_PLAN_IDS } from '@/lib/onboarding/plans'
import { ACTIVE_ORG_COOKIE } from '@/lib/org'
import { cookies } from 'next/headers'

function asPlanId(value: string | null | undefined): SubscriptionPlanId {
  if (value && SUBSCRIPTION_PLAN_IDS.includes(value as SubscriptionPlanId)) {
    return value as SubscriptionPlanId
  }
  return 'profesional'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    planId?: string
    billingCycle?: string
    timing?: BillingChangeTiming
    purpose?: BillingPurpose
  }

  const validated = validatePlanCycle(body.planId, body.billingCycle)
  if (!validated.ok) {
    return NextResponse.json({ message: validated.message }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ message: 'Configuración incompleta.' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null
  if (!activeOrgId) {
    return NextResponse.json({ message: 'Seleccioná un tenant.' }, { status: 409 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select(
      'organization_id, organizations!inner(id, name, subscription_owner_id, subscription_status, selected_plan, billing_cycle)'
    )
    .eq('user_id', user.id)
    .eq('organization_id', activeOrgId)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ message: 'Sin organización.' }, { status: 404 })
  }

  const org = membership.organizations as unknown as {
    id: string
    name: string
    subscription_owner_id: string | null
    subscription_status: string
    selected_plan: string | null
    billing_cycle: string | null
  }

  if (org.subscription_owner_id && org.subscription_owner_id !== user.id) {
    return NextResponse.json({ message: 'Solo el dueño puede gestionar la suscripción.' }, { status: 403 })
  }

  if (!['active', 'past_due'].includes(org.subscription_status)) {
    return NextResponse.json({ message: 'Tu suscripción no está activa.' }, { status: 400 })
  }

  const currentPlan = asPlanId(org.selected_plan)
  const currentCycle =
    org.billing_cycle === 'monthly' || org.billing_cycle === 'semiannual' || org.billing_cycle === 'annual'
      ? org.billing_cycle
      : 'annual'

  const purpose: BillingPurpose =
    body.purpose === 'update_card'
      ? 'update_card'
      : currentPlan !== validated.planId || currentCycle !== validated.billingCycle
        ? 'change'
        : 'change'

  const timing = resolveCheckoutTiming({
    purpose,
    currentPlan,
    currentCycle,
    nextPlan: validated.planId,
    nextCycle: validated.billingCycle,
    requestedTiming: body.timing,
    subscriptionStatus: org.subscription_status,
  })

  if (timing === 'at_renewal') {
    await scheduleSubscriptionChange(admin, {
      organizationId: org.id,
      planId: validated.planId,
      billingCycle: validated.billingCycle,
      currentPlan,
      currentCycle,
    })

    return NextResponse.json({
      scheduled: true,
      timing: 'at_renewal',
      planId: validated.planId,
      billingCycle: validated.billingCycle,
      message: 'El cambio se aplicará en tu próxima renovación.',
    })
  }

  const checkout = await prepareBillingCheckout(admin, {
    organizationId: org.id,
    userId: user.id,
    userEmail: user.email ?? '',
    businessName: org.name,
    planId: validated.planId,
    billingCycle: validated.billingCycle,
    purpose,
    currentPlan,
    currentCycle,
    successPath: '/api/billing/confirm',
    cancelPath: '/ajustes?view=facturacion&canceled=1',
  })

  if (!checkout.ok) {
    return NextResponse.json({ message: checkout.message }, { status: 502 })
  }

  return NextResponse.json({
    scheduled: false,
    timing: 'immediate',
    checkoutUrl: checkout.checkoutUrl,
    provider: checkout.provider,
    amountCents: checkout.amountCents,
    perMonthUsd: checkout.perMonthUsd,
  })
}
