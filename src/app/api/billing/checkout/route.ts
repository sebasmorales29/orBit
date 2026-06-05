import { NextResponse } from 'next/server'
import { prepareBillingCheckout, validatePlanCycle } from '@/lib/billing/prepare-checkout'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string
    planId?: string
    billingCycle?: string
  }

  const validated = validatePlanCycle(body.planId, body.billingCycle)
  if (!validated.ok) {
    return NextResponse.json({ message: validated.message }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations!inner(id, name, subscription_owner_id, subscription_status)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ message: 'Completá la configuración primero.' }, { status: 400 })
  }

  const org = membership.organizations as unknown as {
    id: string
    name: string
    subscription_owner_id: string | null
    subscription_status: string
  }

  if (body.organizationId && body.organizationId !== org.id) {
    return NextResponse.json({ message: 'Organización no coincide.' }, { status: 403 })
  }

  if (org.subscription_owner_id && org.subscription_owner_id !== user.id) {
    return NextResponse.json({ message: 'Solo el dueño puede activar la suscripción.' }, { status: 403 })
  }

  if (org.subscription_status === 'active') {
    return NextResponse.json({ message: 'Tu plan ya está activo.', alreadyActive: true }, { status: 200 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ message: 'Configuración incompleta.' }, { status: 500 })
  }

  const checkout = await prepareBillingCheckout(admin, {
    organizationId: org.id,
    userId: user.id,
    userEmail: user.email ?? '',
    businessName: org.name,
    planId: validated.planId,
    billingCycle: validated.billingCycle,
    purpose: 'activation',
    cancelPath: '/onboarding?step=8&canceled=1',
  })

  if (!checkout.ok) {
    return NextResponse.json({ message: checkout.message }, { status: 502 })
  }

  return NextResponse.json({
    checkoutUrl: checkout.checkoutUrl,
    provider: checkout.provider,
    amountCents: checkout.amountCents,
    perMonthUsd: checkout.perMonthUsd,
  })
}
