import { cache } from 'react'
import { readBrandEnv } from '@/lib/brand-env'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveOpsAccess } from '@/lib/platform/ops-access'
import { getSessionActor } from '@/lib/platform/session-actor'

/** Super administrador único (dueño de Velum). Solo este correo gestiona accesos /ops. */
export function getSuperAdminEmail(): string | null {
  const superRaw = readBrandEnv('PLATFORM_SUPER_ADMIN_EMAIL')?.toLowerCase()
  if (superRaw) return superRaw

  const legacy = readBrandEnv('PLATFORM_ADMIN_EMAILS') ?? process.env.VELUM_PLATFORM_ADMIN_EMAILS ?? ''
  const first = legacy
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)[0]
  return first ?? null
}

/** @deprecated Usá getSuperAdminEmail. Mantenido por compatibilidad. */
export function getPlatformAdminEmails(): string[] {
  const superEmail = getSuperAdminEmail()
  return superEmail ? [superEmail] : []
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const superEmail = getSuperAdminEmail()
  if (!superEmail) return false
  return email.trim().toLowerCase() === superEmail
}

export async function getSessionUserEmail(): Promise<string | null> {
  const actor = await getSessionActor()
  return actor?.email ?? null
}

export async function getSessionUserId(): Promise<string | null> {
  const actor = await getSessionActor()
  return actor?.userId ?? null
}

export async function isPlatformAdminEmail(
  email: string | null | undefined
): Promise<boolean> {
  const access = await resolveOpsAccess(email)
  return access.allowed
}

async function assertSuperAdminUncached(): Promise<
  | { ok: true; email: string; userId: string }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' | 'not_configured' }
> {
  const superEmail = getSuperAdminEmail()
  if (!superEmail) {
    return { ok: false, reason: 'not_configured' }
  }

  const actor = await getSessionActor()
  if (!actor) return { ok: false, reason: 'unauthenticated' }
  if (!isSuperAdminEmail(actor.email)) return { ok: false, reason: 'forbidden' }

  return { ok: true, email: actor.email, userId: actor.userId }
}

export const assertSuperAdmin = cache(assertSuperAdminUncached)

async function assertPlatformAdminUncached(): Promise<
  | { ok: true; email: string; userId: string; isSuper: boolean }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' | 'not_configured' }
> {
  const superEmail = getSuperAdminEmail()
  if (!superEmail) {
    return { ok: false, reason: 'not_configured' }
  }

  const actor = await getSessionActor()
  if (!actor) return { ok: false, reason: 'unauthenticated' }

  const access = await resolveOpsAccess(actor.email)
  if (!access.allowed) return { ok: false, reason: 'forbidden' }

  return { ok: true, email: actor.email, userId: actor.userId, isSuper: access.isSuper }
}

export const assertPlatformAdmin = cache(assertPlatformAdminUncached)

/** Tabla platform_ops_admins disponible (migración aplicada). */
export async function isOpsAccessTableReady(): Promise<boolean> {
  const admin = createAdminClient()
  if (!admin) return false
  const { error } = await admin.from('platform_ops_admins').select('id').limit(1)
  return !error?.message?.includes('does not exist')
}
