import { NextResponse, type NextRequest } from 'next/server'
import { getSuperAdminEmail } from '@/lib/platform/admin'
import { getOpsMfaStatusForEmail } from '@/lib/platform/ops-mfa'
import { resolveOpsAccess } from '@/lib/platform/ops-access'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/env'

function withRefreshedCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
    })
  })
  return to
}

export async function GET(request: NextRequest) {
  const superEmail = getSuperAdminEmail()
  const configured =
    Boolean(superEmail) && isSupabaseConfigured() && isServiceRoleConfigured()

  if (!configured) {
    return NextResponse.json({
      configured: false,
      authenticated: false,
      admin: false,
    })
  }

  const cookieCarrier = NextResponse.next()
  const supabase = createRouteHandlerClient(request, cookieCarrier)
  if (!supabase) {
    return NextResponse.json({ configured: false, authenticated: false, admin: false })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return withRefreshedCookies(
      cookieCarrier,
      NextResponse.json({
        configured: true,
        authenticated: false,
        admin: false,
      })
    )
  }

  const email = user.email.trim().toLowerCase()
  const access = await resolveOpsAccess(email)
  if (!access.allowed) {
    return withRefreshedCookies(
      cookieCarrier,
      NextResponse.json({
        configured: true,
        authenticated: true,
        admin: false,
        email,
      })
    )
  }

  const mfa = await getOpsMfaStatusForEmail(supabase, email)
  return withRefreshedCookies(
    cookieCarrier,
    NextResponse.json({
      configured: true,
      authenticated: true,
      admin: true,
      email,
      isSuper: access.isSuper,
      mfa,
    })
  )
}
