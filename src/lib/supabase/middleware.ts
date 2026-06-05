import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import {
  getOpsHost,
  getPublicAppUrl,
  hostSplitEnabled,
  isOpsHost,
  isPublicAppHost,
  opsOrigin,
} from '@/lib/platform/ops-host'

function redirectWithCookies(url: URL, from: NextResponse) {
  const res = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => {
    res.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
    })
  })
  return res
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const next = () => NextResponse.next({ request: { headers: requestHeaders } })
  let supabaseResponse = next()

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
        supabaseResponse = next()
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.email && user.id) {
    requestHeaders.set('x-ops-user-email', user.email.trim().toLowerCase())
    requestHeaders.set('x-ops-user-id', user.id)
  } else {
    requestHeaders.delete('x-ops-user-email')
    requestHeaders.delete('x-ops-user-id')
  }

  const refreshedCookies = supabaseResponse.cookies.getAll()
  supabaseResponse = next()
  refreshedCookies.forEach((cookie) => {
    supabaseResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
    })
  })

  const requestHost = request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')

  if (hostSplitEnabled()) {
    const onOps = isOpsHost(requestHost)
    const onPublic = isPublicAppHost(requestHost)

    if (onPublic && pathname.startsWith('/ops')) {
      const dest = new URL(`${pathname}${request.nextUrl.search}`, opsOrigin(proto))
      return NextResponse.redirect(dest)
    }

    if (onOps) {
      if (pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/ops'
        return NextResponse.redirect(url)
      }

      const allowedOnOpsHost =
        pathname.startsWith('/ops') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/change-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/_not-found')

      if (!allowedOnOpsHost) {
        const publicOrigin = getPublicAppUrl()
        if (publicOrigin) {
          const dest = new URL(pathname === '/' ? '/' : pathname, publicOrigin)
          dest.search = request.nextUrl.search
          return NextResponse.redirect(dest)
        }
        const url = request.nextUrl.clone()
        url.pathname = '/_not-found'
        return NextResponse.rewrite(url)
      }
    }

    if (!onOps && !onPublic && getOpsHost()) {
      const url = request.nextUrl.clone()
      url.pathname = '/_not-found'
      return NextResponse.rewrite(url)
    }
  }

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
  const isOpsLogin = pathname === '/ops/login'
  const isOpsMfa = pathname === '/ops/mfa'
  const isOpsLogout = pathname === '/ops/logout'

  if (isOpsLogin || isOpsMfa) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const next = request.nextUrl.searchParams.get('next') ?? '/ops'
    url.searchParams.set('next', next.startsWith('/ops') ? next : '/ops')
    return redirectWithCookies(url, supabaseResponse)
  }

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

  // Ops: el gate de auth vive en (console)/layout.tsx, no acá (evita perder sesión al navegar).
  if (!user && !isPublicMarketing && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (!url.searchParams.has('next')) {
      url.searchParams.set('next', pathname)
    }
    return redirectWithCookies(url, supabaseResponse)
  }

  // Forzar cambio de contraseña si la cuenta lo requiere (solo app pública, no /ops).
  const mustChange = Boolean(
    (user?.user_metadata as Record<string, unknown> | undefined)?.must_change_password
  )
  if (user && mustChange && !isChangePassword && !isOpsRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/change-password'
    url.searchParams.set('next', pathname)
    return redirectWithCookies(url, supabaseResponse)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    const nextPath = request.nextUrl.searchParams.get('next')
    url.pathname = nextPath && nextPath.startsWith('/') ? nextPath : '/hoy'
    url.search = ''
    return redirectWithCookies(url, supabaseResponse)
  }

  if (user && isResetPassword) {
    return supabaseResponse
  }

  return supabaseResponse
}
