import { NextResponse, type NextRequest } from 'next/server'
import { getSuperAdminEmail } from '@/lib/platform/admin'
import { getOpsMfaStatusForEmail } from '@/lib/platform/ops-mfa'
import { resolveOpsAccess } from '@/lib/platform/ops-access'
import { copyResponseCookies, createRouteHandlerClient } from '@/lib/supabase/route-handler'
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/env'

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

  const client = createRouteHandlerClient(request)
  if (!client) {
    return NextResponse.json({ configured: false, authenticated: false, admin: false })
  }

  const {
    data: { user },
    error: userError,
  } = await client.supabase.auth.getUser()

  if (userError || !user?.email) {
    return copyResponseCookies(
      client.getResponse(),
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
    return copyResponseCookies(
      client.getResponse(),
      NextResponse.json({
        configured: true,
        authenticated: true,
        admin: false,
        email,
      })
    )
  }

  const mfa = await getOpsMfaStatusForEmail(client.supabase, email)
  return copyResponseCookies(
    client.getResponse(),
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
