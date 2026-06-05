import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { OPS_ENTRY_COOKIE } from '@/lib/platform/ops-cookie'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const env = getSupabaseEnv()
  if (!env) {
    return supabaseResponse
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublicMarketing =
    pathname === '/' ||
    pathname.startsWith('/api/marketing/') ||
    pathname.startsWith('/t/') ||
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/privacidad')

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password')

  const isResetPassword = pathname.startsWith('/reset-password')

  const isOpsRoute = pathname.startsWith('/ops')
  const isOpsEntry = pathname.startsWith('/ops/entry/')
  const isOpsLogout = pathname === '/ops/logout'

  if (isOpsRoute) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  const isAppRoute =
    pathname.startsWith('/hoy') ||
    pathname.startsWith('/ventas') ||
    pathname.startsWith('/pedidos') ||
    pathname.startsWith('/stock') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/metricas') ||
    pathname.startsWith('/plantillas') ||
    pathname.startsWith('/ajustes') ||
    pathname.startsWith('/mas') ||
    pathname.startsWith('/onboarding')

  const isChangePassword = pathname.startsWith('/change-password')

  if (!user && !isPublicMarketing && (isAppRoute || (isOpsRoute && !isOpsLogout))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Forzar cambio de contraseña si la cuenta lo requiere (solo app pública, no /ops).
  const mustChange = Boolean(
    (user?.user_metadata as Record<string, unknown> | undefined)?.must_change_password
  )
  if (user && mustChange && !isChangePassword && !isOpsRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/change-password'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // /ops solo se puede acceder si antes entraste por /ops/entry/<token>
  // (y además cumplís el gate dentro de /ops/layout.tsx).
  if (user && isOpsRoute && !isOpsEntry && !isOpsLogout) {
    const hasCookie = request.cookies.get(OPS_ENTRY_COOKIE)?.value === '1'
    if (!hasCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/_not-found'
      return NextResponse.rewrite(url)
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/hoy'
    return NextResponse.redirect(url)
  }

  if (user && isResetPassword) {
    return supabaseResponse
  }

  return supabaseResponse
}
