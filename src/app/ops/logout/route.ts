import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OPS_ENTRY_COOKIE, opsEntryCookieOptions } from '@/lib/platform/ops-cookie'

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const res = NextResponse.redirect(new URL('/', request.url))
  res.cookies.set(OPS_ENTRY_COOKIE, '', { ...opsEntryCookieOptions(), maxAge: 0 })
  return res
}
