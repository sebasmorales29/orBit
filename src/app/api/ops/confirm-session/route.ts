import { NextResponse } from 'next/server'
import { assertPlatformAdmin } from '@/lib/platform/admin'
import { OPS_ENTRY_COOKIE, opsEntryCookieOptions } from '@/lib/platform/ops-cookie'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'

/** Refuerza la sesión de Ops tras MFA (cookie opcional, ya no bloquea el acceso). */
export async function POST() {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 403 })
  }

  const status = await getOpsMfaStatus()
  if (!status || (status.mfaRequired && !status.satisfied)) {
    return NextResponse.json({ error: 'MFA_REQUIRED' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(OPS_ENTRY_COOKIE, '1', {
    ...opsEntryCookieOptions(),
    maxAge: 60 * 60 * 12,
  })
  return res
}
