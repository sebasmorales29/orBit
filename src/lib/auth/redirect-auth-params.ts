import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveAuthNextPath } from '@/lib/auth/safe-next-path'

const AUTH_LANDING_PATHS = new Set(['/', '/login', '/signup', '/forgot-password'])

/** Redirige `?code=` / `?token_hash=` en landing a `/auth/callback` (server-side). */
export function redirectAuthParamsToCallback(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  if (!AUTH_LANDING_PATHS.has(pathname)) return null

  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  if (!code && !tokenHash) return null

  const url = request.nextUrl.clone()
  url.pathname = '/auth/callback'

  if (!url.searchParams.has('next')) {
    const inferredType =
      type ?? (code && pathname === '/' && !request.nextUrl.searchParams.get('next') ? 'recovery' : null)
    url.searchParams.set('next', resolveAuthNextPath(null, inferredType))
  }

  return NextResponse.redirect(url)
}
