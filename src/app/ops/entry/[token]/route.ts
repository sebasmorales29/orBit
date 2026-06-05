import { NextResponse } from 'next/server'
import { assertSuperAdmin } from '@/lib/platform/admin'
import { OPS_ENTRY_COOKIE, opsEntryCookieOptions } from '@/lib/platform/ops-cookie'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const gate = await assertSuperAdmin()
  if (!gate.ok) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { token } = await params
  const expected = process.env.ORBIT_OPS_ENTRY_TOKEN?.trim()
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const res = NextResponse.redirect(new URL('/ops', req.url))
  res.cookies.set(OPS_ENTRY_COOKIE, '1', {
    ...opsEntryCookieOptions(),
    maxAge: 60 * 60 * 12, // 12h
  })
  return res
}

