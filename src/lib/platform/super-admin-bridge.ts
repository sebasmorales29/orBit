import {
  getSessionUserEmail,
  getSessionUserId,
  isSuperAdminEmail,
} from '@/lib/platform/admin'
import { createClient } from '@/lib/supabase/server'

export type SuperAdminBridge = {
  opsHref: '/ops'
  /** Landing pública (sitio public-facing). */
  publicAppHref: '/'
}

/** Puente solo para el super admin: /ops ↔ app pública o tenant */
export async function getSuperAdminBridge(): Promise<SuperAdminBridge | null> {
  const email = await getSessionUserEmail()
  if (!isSuperAdminEmail(email)) return null

  const userId = await getSessionUserId()
  if (!userId) return null

  // Nota: aunque el super admin tenga tenant, desde /ops queremos ir al sitio público (landing),
  // no a la app del tenant.
  void createClient
  void userId
  return { opsHref: '/ops', publicAppHref: '/' }
}
