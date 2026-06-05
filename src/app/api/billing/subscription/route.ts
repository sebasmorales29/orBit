import { NextResponse } from 'next/server'
import { getSubscriptionSnapshot } from '@/lib/billing/get-subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/org'
import { cookies } from 'next/headers'

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

  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null
  if (!activeOrgId) {
    return NextResponse.json({ message: 'Seleccioná un tenant.' }, { status: 409 })
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', activeOrgId)
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
