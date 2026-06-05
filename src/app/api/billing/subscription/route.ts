import { NextResponse } from 'next/server'
import { getSubscriptionSnapshot } from '@/lib/billing/get-subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ message: 'Configuración incompleta.' }, { status: 500 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership?.organization_id) {
    return NextResponse.json({ message: 'Sin organización.' }, { status: 404 })
  }

  const snapshot = await getSubscriptionSnapshot(admin, {
    organizationId: membership.organization_id,
    userId: user.id,
  })

  if (!snapshot) {
    return NextResponse.json({ message: 'Organización no encontrada.' }, { status: 404 })
  }

  return NextResponse.json(snapshot)
}
