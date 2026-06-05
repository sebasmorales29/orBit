import { headers } from 'next/headers'
import { cache } from 'react'
import { getAuthUser } from '@/lib/supabase/server'

export type SessionActor = {
  email: string
  userId: string
}

/** Identidad del request: primero headers del middleware, luego Supabase. */
export const getSessionActor = cache(async (): Promise<SessionActor | null> => {
  const h = await headers()
  const headerEmail = h.get('x-ops-user-email')?.trim().toLowerCase()
  const headerUserId = h.get('x-ops-user-id')?.trim()

  if (headerEmail && headerUserId) {
    return { email: headerEmail, userId: headerUserId }
  }

  const user = await getAuthUser()
  if (!user?.email || !user.id) return null

  return {
    email: user.email.trim().toLowerCase(),
    userId: user.id,
  }
})
