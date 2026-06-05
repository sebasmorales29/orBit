import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { getSupabaseEnv } from '@/lib/supabase/env'

export const createClient = cache(async () => {
  const env = getSupabaseEnv()
  if (!env) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — ignore
        }
      },
    },
  })
})

/** Una sola lectura de usuario por request (evita perder sesión en Ops). */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
