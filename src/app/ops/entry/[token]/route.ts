import { NextResponse } from 'next/server'
import { OPS_ENTRY_COOKIE, opsEntryCookieOptions } from '@/lib/platform/ops-cookie'
import { establishSuperAdminSession } from '@/lib/platform/ops-entry-session'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const expected = process.env.ORBIT_OPS_ENTRY_TOKEN?.trim()
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const session = await establishSuperAdminSession()
  if (!session.ok) {
    return NextResponse.json({ error: session.message }, { status: 500 })
  }

  const res = NextResponse.redirect(new URL('/ops/login', req.url))
  res.cookies.set(OPS_ENTRY_COOKIE, '1', {
    ...opsEntryCookieOptions(),
    maxAge: 60 * 60 * 12, // 12h
  })
  return res
}
