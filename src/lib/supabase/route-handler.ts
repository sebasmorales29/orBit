import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

type CookieToSet = { name: string; value: string; options: CookieOptions }

type RouteHandlerClient = {
  supabase: ReturnType<typeof createServerClient>
  getResponse: () => NextResponse
}

function makeResponse(request: NextRequest, redirectTo?: URL) {
  if (redirectTo) {
    return NextResponse.redirect(redirectTo)
  }
  return NextResponse.next({ request })
}

/**
 * Cliente Supabase para Route Handlers.
 * Recrea la respuesta en cada setAll para evitar cookies de auth corruptas (chunks).
 */
export function createRouteHandlerClient(
  request: NextRequest,
  redirectTo?: URL
): RouteHandlerClient | null {
  const env = getSupabaseEnv()
  if (!env) return null

  let response = makeResponse(request, redirectTo)

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = makeResponse(request, redirectTo)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  return {
    supabase,
    getResponse: () => response,
  }
}

export function copyResponseCookies(from: NextResponse, to: NextResponse) {
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
