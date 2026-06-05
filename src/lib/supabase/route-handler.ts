import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/** Cliente Supabase para Route Handlers — usa cookies del request, no cookies() de next/headers. */
export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  const env = getSupabaseEnv()
  if (!env) return null

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}
