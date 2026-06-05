import {
  assertSuperAdmin,
  getSuperAdminEmail,
  getSessionUserEmail,
  isSuperAdminEmail,
} from '@/lib/platform/admin'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface OpsAdminRow {
  id: string
  email: string
  user_id: string | null
  mfa_required: boolean
  created_at: string
  is_super: boolean
  mfa_enrolled: boolean
}

export type OpsAccessResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      code:
        | 'NOT_AUTHORIZED'
        | 'ADMIN_NOT_CONFIGURED'
        | 'FORBIDDEN'
        | 'FAILED'
        | 'NOT_FOUND'
        | 'INVALID'
      message: string
    }

export interface OpsSessionAccess {
  email: string
  userId: string
  isSuper: boolean
  mfaRequired: boolean
}

async function ensureSuper() {
  const gate = await assertSuperAdmin()
  if (!gate.ok) {
    return {
      ok: false as const,
      code: gate.reason === 'not_configured' ? 'ADMIN_NOT_CONFIGURED' as const : 'FORBIDDEN' as const,
      message:
        gate.reason === 'not_configured'
          ? 'Configurá ORBIT_PLATFORM_SUPER_ADMIN_EMAIL en el servidor.'
          : 'Solo el super administrador puede gestionar accesos a /ops.',
    }
  }
  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }
  }
  return { ok: true as const, admin, email: gate.email, userId: gate.userId }
}

/** ¿Puede entrar a /ops? (super admin o fila en platform_ops_admins) */
export async function resolveOpsAccess(
  email: string | null | undefined
): Promise<{ allowed: boolean; mfaRequired: boolean; isSuper: boolean }> {
  if (!email) return { allowed: false, mfaRequired: false, isSuper: false }

  const normalized = email.trim().toLowerCase()
  if (isSuperAdminEmail(normalized)) {
    return { allowed: true, mfaRequired: true, isSuper: true }
  }

  const admin = createAdminClient()
  if (!admin) return { allowed: false, mfaRequired: false, isSuper: false }

  const { data, error } = await admin
    .from('platform_ops_admins')
    .select('mfa_required')
    .eq('email', normalized)
    .maybeSingle()

  if (error?.message?.includes('does not exist')) {
    return { allowed: false, mfaRequired: false, isSuper: false }
  }

  if (!data) return { allowed: false, mfaRequired: false, isSuper: false }

  return {
    allowed: true,
    mfaRequired: data.mfa_required ?? true,
    isSuper: false,
  }
}

export async function getOpsSessionAccess(): Promise<OpsSessionAccess | null> {
  const supabaseEmail = await getSessionUserEmail()
  if (!supabaseEmail) return null

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) return null

  const access = await resolveOpsAccess(supabaseEmail)
  if (!access.allowed) return null

  return {
    email: supabaseEmail.trim().toLowerCase(),
    userId: user.id,
    isSuper: access.isSuper,
    mfaRequired: access.mfaRequired,
  }
}

export async function listOpsAdmins(): Promise<OpsAccessResult<OpsAdminRow[]>> {
  const ctx = await ensureSuper()
  if (!ctx.ok) return ctx

  const superEmail = getSuperAdminEmail()
  const { data: rows, error } = await ctx.admin.from('platform_ops_admins').select('*').order('created_at', {
    ascending: true,
  })

  if (error) {
    if (error.message.includes('does not exist')) {
      return { ok: true, data: superEmail ? [await superAdminRow(ctx.admin, superEmail)] : [] }
    }
    return { ok: false, code: 'FAILED', message: error.message }
  }

  const list: OpsAdminRow[] = []

  if (superEmail) {
    list.push(await superAdminRow(ctx.admin, superEmail))
  }

  for (const row of rows ?? []) {
    const mfaEnrolled = row.user_id
      ? await userHasVerifiedMfa(ctx.admin, row.user_id)
      : await userHasVerifiedMfaByEmail(ctx.admin, row.email)
    list.push({
      id: row.id,
      email: row.email,
      user_id: row.user_id,
      mfa_required: row.mfa_required,
      created_at: row.created_at,
      is_super: false,
      mfa_enrolled: mfaEnrolled,
    })
  }

  return { ok: true, data: list }
}

async function superAdminRow(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string
): Promise<OpsAdminRow> {
  const userId = await findUserIdByEmail(admin, email)
  const mfaEnrolled = userId ? await userHasVerifiedMfa(admin, userId) : false
  return {
    id: 'super',
    email,
    user_id: userId,
    mfa_required: true,
    created_at: new Date(0).toISOString(),
    is_super: true,
    mfa_enrolled: mfaEnrolled,
  }
}

async function findUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase()
  let page = 1
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return null
    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match) return match.id
    if (data.users.length < 200) break
    page += 1
  }
  return null
}

async function userHasVerifiedMfa(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string
): Promise<boolean> {
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId })
  if (error) return false
  return (data.factors ?? []).some((f) => f.status === 'verified')
}

async function userHasVerifiedMfaByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string
): Promise<boolean> {
  const userId = await findUserIdByEmail(admin, email)
  if (!userId) return false
  return userHasVerifiedMfa(admin, userId)
}

export async function addOpsAdmin(email: string): Promise<OpsAccessResult<OpsAdminRow>> {
  const ctx = await ensureSuper()
  if (!ctx.ok) return ctx

  const normalized = email.trim().toLowerCase()
  if (!normalized.includes('@')) {
    return { ok: false, code: 'INVALID', message: 'Correo inválido.' }
  }

  const superEmail = getSuperAdminEmail()
  if (superEmail && normalized === superEmail) {
    return { ok: false, code: 'INVALID', message: 'El super admin ya tiene acceso automático.' }
  }

  const userId = await findUserIdByEmail(ctx.admin, normalized)

  const { data, error } = await ctx.admin
    .from('platform_ops_admins')
    .insert({
      email: normalized,
      user_id: userId,
      mfa_required: true,
      created_by: ctx.userId,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { ok: false, code: 'INVALID', message: 'Ese correo ya tiene acceso a /ops.' }
    }
    return { ok: false, code: 'FAILED', message: error.message }
  }

  const mfaEnrolled = userId ? await userHasVerifiedMfa(ctx.admin, userId) : false

  return {
    ok: true,
    data: {
      id: data.id,
      email: data.email,
      user_id: data.user_id,
      mfa_required: data.mfa_required,
      created_at: data.created_at,
      is_super: false,
      mfa_enrolled: mfaEnrolled,
    },
  }
}

export async function removeOpsAdmin(id: string): Promise<OpsAccessResult<{ id: string }>> {
  const ctx = await ensureSuper()
  if (!ctx.ok) return ctx

  if (id === 'super') {
    return { ok: false, code: 'INVALID', message: 'No podés quitar al super administrador.' }
  }

  const { error } = await ctx.admin.from('platform_ops_admins').delete().eq('id', id)
  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { id } }
}

export async function setOpsAdminMfaRequired(
  id: string,
  mfaRequired: boolean
): Promise<OpsAccessResult<{ id: string }>> {
  const ctx = await ensureSuper()
  if (!ctx.ok) return ctx

  if (id === 'super') {
    return { ok: false, code: 'INVALID', message: 'El super admin siempre requiere MFA.' }
  }

  const { error } = await ctx.admin
    .from('platform_ops_admins')
    .update({ mfa_required: mfaRequired })
    .eq('id', id)

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { id } }
}

/** Desactiva MFA (elimina factores TOTP) de un usuario de ops */
export async function disableOpsUserMfa(
  target: { userId?: string | null; email: string }
): Promise<OpsAccessResult<{ removed: number }>> {
  const ctx = await ensureSuper()
  if (!ctx.ok) return ctx

  // Requiere sesión del super admin verificada con MFA (AAL2).
  // La verificación se hace en el cliente (código TOTP) y el server confirma AAL.
  try {
    const supabase = await createClient()
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel !== 'aal2') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Para desactivar MFA necesitás confirmar con tu código (MFA requerido).',
      }
    }
  } catch {
    return {
      ok: false,
      code: 'FAILED',
      message: 'No se pudo validar MFA de la sesión. Reintentá.',
    }
  }

  let userId = target.userId ?? null
  if (!userId) {
    userId = await findUserIdByEmail(ctx.admin, target.email)
  }
  if (!userId) {
    return { ok: false, code: 'NOT_FOUND', message: 'Usuario sin cuenta en Supabase Auth aún.' }
  }

  const { data, error } = await ctx.admin.auth.admin.mfa.listFactors({ userId })
  if (error) return { ok: false, code: 'FAILED', message: error.message }

  let removed = 0
  for (const factor of data.factors ?? []) {
    const { error: delError } = await ctx.admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId,
    })
    if (delError) return { ok: false, code: 'FAILED', message: delError.message }
    removed += 1
  }

  return { ok: true, data: { removed } }
}
