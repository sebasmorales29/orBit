'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resolveAuthNextPath } from '@/lib/auth/safe-next-path'

/**
 * Captura links de auth que caen en `/` u otras rutas (p. ej. recovery desde
 * Supabase dashboard con Site URL = landing) y los envía a /auth/callback o
 * /reset-password según corresponda.
 */
export function AuthRedirectHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    if (pathname.startsWith('/auth/callback')) return

    const supabase = createClient()
    const hash = window.location.hash

    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      handled.current = true
      router.replace(`/reset-password${hash}`)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    if (tokenHash && type) {
      handled.current = true
      const next = resolveAuthNextPath(params.get('next'), type)
      const dest = new URLSearchParams({ token_hash: tokenHash, type, next })
      router.replace(`/auth/callback?${dest.toString()}`)
      return
    }

    if (code) {
      handled.current = true
      const next = resolveAuthNextPath(
        params.get('next'),
        type ?? (pathname === '/' ? 'recovery' : null)
      )
      const dest = new URLSearchParams({ code, next })
      if (type) dest.set('type', type)
      router.replace(`/auth/callback?${dest.toString()}`)
    }
  }, [pathname, router])

  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && !pathname.startsWith('/reset-password')) {
        router.replace('/reset-password')
      }
    })
    return () => subscription.unsubscribe()
  }, [pathname, router])

  return null
}
