import { NextResponse, type NextRequest } from 'next/server'
import { getSuperAdminEmail } from '@/lib/platform/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function establishSuperAdminSessionOnRedirect(
  request: NextRequest,
  redirectTo: URL
): Promise<NextResponse> {
  const email = getSuperAdminEmail()
  if (!email) {
    return NextResponse.json({ error: 'Super admin no configurado.' }, { status: 500 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Service role no configurado.' }, { status: 500 })
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo iniciar sesión.' },
      { status: 500 }
    )
  }

  if (!getSupabaseEnv()) {
    return NextResponse.json({ error: 'Supabase no configurado.' }, { status: 500 })
  }

  const client = createRouteHandlerClient(request, redirectTo)
  if (!client) {
    return NextResponse.json({ error: 'Supabase no configurado.' }, { status: 500 })
  }

  const magic = await client.supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })

  if (!magic.error) {
    return client.getResponse()
  }

  const retry = createRouteHandlerClient(request, redirectTo)
  if (!retry) {
    return NextResponse.json({ error: magic.error.message }, { status: 500 })
  }

  const emailOtp = await retry.supabase.auth.verifyOtp({
    type: 'email',
    email,
    token_hash: tokenHash,
  })

  if (emailOtp.error) {
    return NextResponse.json({ error: emailOtp.error.message }, { status: 500 })
  }

  return retry.getResponse()
}
