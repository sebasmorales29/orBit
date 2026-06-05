import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { getSuperAdminEmail } from '@/lib/platform/admin'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const env = getSupabaseEnv()
  if (!env) {
    return NextResponse.json({ error: 'Supabase no configurado.' }, { status: 500 })
  }

  const cookieStore = await cookies()
  let response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 })
  }

  return response
}
