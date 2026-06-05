import { NextRequest, NextResponse } from 'next/server'
import { OPS_ENTRY_COOKIE, opsEntryCookieOptions } from '@/lib/platform/ops-cookie'
import { establishSuperAdminSessionOnRedirect } from '@/lib/platform/ops-entry-session'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'

function redirectWithCookies(url: URL, from: NextResponse) {
  const next = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => {
    next.cookies.set(cookie.name, cookie.value)
  })
  return next
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const expected = process.env.ORBIT_OPS_ENTRY_TOKEN?.trim()
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const loginUrl = new URL('/ops/login', req.url)
  const res = await establishSuperAdminSessionOnRedirect(req, loginUrl)

  if (!res.headers.get('location')) {
    return res
  }

  res.cookies.set(OPS_ENTRY_COOKIE, '1', {
    ...opsEntryCookieOptions(),
    maxAge: 60 * 60 * 12, // 12h
  })

  const status = await getOpsMfaStatus()
  if (status && (!status.mfaRequired || status.satisfied)) {
    return redirectWithCookies(new URL('/ops', req.url), res)
  }

  return res
}
