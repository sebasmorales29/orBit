import { NextResponse } from 'next/server'
import {
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
} from '@/lib/billing/finalize-payment'
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

  const body = (await request.json().catch(() => ({}))) as { action?: 'cancel' | 'reactivate' }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ message: 'Configuración incompleta.' }, { status: 500 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select(
      'organization_id, organizations!inner(id, subscription_owner_id, subscription_status)'
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ message: 'Sin organización.' }, { status: 404 })
  }

  const org = membership.organizations as unknown as {
    id: string
    subscription_owner_id: string | null
    subscription_status: string
  }

  if (org.subscription_owner_id && org.subscription_owner_id !== user.id) {
    return NextResponse.json({ message: 'Solo el dueño puede gestionar la suscripción.' }, { status: 403 })
  }

  if (body.action === 'reactivate') {
    await reactivateSubscription(admin, org.id)
    return NextResponse.json({ reactivated: true })
  }

  if (!['active', 'past_due'].includes(org.subscription_status)) {
    return NextResponse.json({ message: 'No hay suscripción activa que cancelar.' }, { status: 400 })
  }

  await cancelSubscriptionAtPeriodEnd(admin, org.id)
  return NextResponse.json({ canceledAtPeriodEnd: true })
}
