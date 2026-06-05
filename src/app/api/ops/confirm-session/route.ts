import { NextResponse, type NextRequest } from 'next/server'
import { OPS_ENTRY_COOKIE, opsEntryCookieOptions } from '@/lib/platform/ops-cookie'
import { getOpsMfaStatusForEmail } from '@/lib/platform/ops-mfa'
import { resolveOpsAccess } from '@/lib/platform/ops-access'
import { copyResponseCookies, createRouteHandlerClient } from '@/lib/supabase/route-handler'

/** Refuerza la sesión de Ops tras MFA (cookie opcional, ya no bloquea el acceso). */
export async function POST(request: NextRequest) {
  const client = createRouteHandlerClient(request)
  if (!client) {
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 500 })
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 403 })
  }

  const email = user.email.trim().toLowerCase()
  const access = await resolveOpsAccess(email)
  if (!access.allowed) {
    return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 403 })
  }

  const status = await getOpsMfaStatusForEmail(client.supabase, email)
  if (!status || (status.mfaRequired && !status.satisfied)) {
    return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 })
  }

  const res = copyResponseCookies(client.getResponse(), NextResponse.json({ ok: true }))
  res.cookies.set(OPS_ENTRY_COOKIE, '1', {
    ...opsEntryCookieOptions(),
    maxAge: 60 * 60 * 12,
  })
  return res
}
