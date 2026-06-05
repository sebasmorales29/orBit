'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/org'

export async function setActiveOrganizationId(input: { organizationId: string }) {
  const organizationId = input.organizationId?.trim()
  if (!organizationId) return { ok: false as const, message: 'Organización inválida.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false as const, message: 'No autenticado.' }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!membership?.organization_id) {
    return { ok: false as const, message: 'No tenés acceso a esa organización.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 año
  })

  return { ok: true as const }
}

