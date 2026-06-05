import { assertPlatformAdmin } from '@/lib/platform/admin'
import {
  canAssignOwnerRole,
  normalizeRoleForDb,
  ownerRoleBlockedMessage,
} from '@/lib/platform/owner-policy'
import { createAdminClient } from '@/lib/supabase/admin'

export interface PlatformUserRow {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  banned_until: string | null
  is_suspended: boolean
  organization_id: string | null
  organization_name: string | null
  member_role: string | null
}

export type PlatformUsersResult =
  | { ok: true; users: PlatformUserRow[] }
  | { ok: false; code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED'; message: string }

export interface PlatformUserDetail {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  banned_until: string | null
  mfa_enrolled: boolean
  organization_id: string | null
  organization_name: string | null
  member_role: string | null
}

export type PlatformUserDetailResult =
  | { ok: true; user: PlatformUserDetail }
  | { ok: false; code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED' | 'NOT_FOUND' | 'FAILED'; message: string }

function gateMessage(gate: { ok: false; reason: 'unauthenticated' | 'forbidden' | 'not_configured' }): string {
  if (gate.reason === 'unauthenticated') {
    return 'Sesión expirada. Volvé a iniciar sesión en orBit.'
  }
  if (gate.reason === 'not_configured') {
    return 'Ops no está configurado en el servidor (super admin o service role).'
  }
  return 'Sin permiso para esta sección de Ops.'
}

export async function queryPlatformUsers(limit = 80): Promise<PlatformUsersResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, code: 'ADMIN_NOT_CONFIGURED', message: 'Falta service role key.' }
  }

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: limit,
  })
  if (authError) {
    return { ok: false, code: 'ADMIN_NOT_CONFIGURED', message: authError.message }
  }

  const userIds = authData.users.map((u) => u.id)
  const orgByUser = new Map<
    string,
    { organization_id: string; role: string; name: string }
  >()

  if (userIds.length > 0) {
    const { data: memberships } = await admin
      .from('organization_members')
      .select('user_id, role, organization_id, organizations!inner(name)')
      .in('user_id', userIds)

    for (const m of memberships ?? []) {
      const org = m.organizations as unknown as { name: string }
      orgByUser.set(m.user_id, {
        organization_id: m.organization_id,
        role: m.role,
        name: org?.name ?? '—',
      })
    }
  }

  const users: PlatformUserRow[] = authData.users.map((u) => {
    const org = orgByUser.get(u.id)
    const bannedUntil = u.banned_until ?? null
    const isSuspended =
      !!bannedUntil && new Date(bannedUntil).getTime() > Date.now()
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
      banned_until: bannedUntil,
      is_suspended: isSuspended,
      organization_id: org?.organization_id ?? null,
      organization_name: org?.name ?? null,
      member_role: org?.role ?? null,
    }
  })

  return { ok: true, users }
}

export async function listPlatformUsers(limit = 80): Promise<PlatformUsersResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    return { ok: false, code: 'NOT_AUTHORIZED', message: gateMessage(gate) }
  }
  return queryPlatformUsers(limit)
}

export async function queryPlatformUserDetail(userId: string): Promise<PlatformUserDetailResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, code: 'ADMIN_NOT_CONFIGURED', message: 'Falta service role key.' }
  }

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId)
  if (userErr) return { ok: false, code: 'FAILED', message: userErr.message }
  const user = userData.user
  if (!user) return { ok: false, code: 'NOT_FOUND', message: 'Usuario no encontrado.' }

  const { data: membership } = await admin
    .from('organization_members')
    .select('role, organization_id, organizations!inner(name)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  const orgName = membership?.organizations as unknown as { name: string } | null
  const { data: mfaData } = await admin.auth.admin.mfa.listFactors({ userId })
  const mfaEnrolled = (mfaData?.factors ?? []).some((f) => f.status === 'verified')

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      banned_until: user.banned_until ?? null,
      mfa_enrolled: mfaEnrolled,
      organization_id: membership?.organization_id ?? null,
      organization_name: orgName?.name ?? null,
      member_role: membership?.role ?? null,
    },
  }
}

export async function getPlatformUserDetail(userId: string): Promise<PlatformUserDetailResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, code: 'NOT_AUTHORIZED', message: 'Sin permiso.' }
  return queryPlatformUserDetail(userId)
}

export async function updatePlatformUser(input: { userId: string; full_name: string | null }) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta service role key.' }
  }

  const { error } = await admin.auth.admin.updateUserById(input.userId, {
    user_metadata: { full_name: input.full_name },
  })
  if (error) return { ok: false as const, code: 'FAILED' as const, message: error.message }

  return { ok: true as const }
}

export async function deletePlatformUser(userId: string) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta service role key.' }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { ok: false as const, code: 'FAILED' as const, message: error.message }

  return { ok: true as const }
}

export async function deactivateUser(userId: string) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta service role key.' }
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: '87600h', // ~10 años
  })
  if (error) return { ok: false as const, code: 'FAILED' as const, message: error.message }
  return { ok: true as const }
}

export async function reactivateUser(userId: string) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta service role key.' }
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  })
  if (error) return { ok: false as const, code: 'FAILED' as const, message: error.message }
  return { ok: true as const }
}

export async function setUserMembership(input: {
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'administrator' | 'member' | 'visitor'
}) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta service role key.' }
  }

  const dbRole = normalizeRoleForDb(input.role)

  if (dbRole === 'owner') {
    const { data: org } = await admin
      .from('organizations')
      .select('subscription_owner_id')
      .eq('id', input.organizationId)
      .maybeSingle()
    if (!canAssignOwnerRole(org?.subscription_owner_id, input.userId)) {
      return { ok: false as const, code: 'FAILED' as const, message: ownerRoleBlockedMessage() }
    }
  }

  // Si el usuario ya pertenece a otro org, lo movemos (single-tenant).
  await admin.from('organization_members').delete().eq('user_id', input.userId)

  const { error } = await admin.from('organization_members').insert({
    user_id: input.userId,
    organization_id: input.organizationId,
    role: dbRole,
  })
  if (error) return { ok: false as const, code: 'FAILED' as const, message: error.message }

  return { ok: true as const }
}

export async function clearUserMembership(userId: string) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false as const, code: 'ADMIN_NOT_CONFIGURED' as const, message: 'Falta service role key.' }
  }

  const { error } = await admin.from('organization_members').delete().eq('user_id', userId)
  if (error) return { ok: false as const, code: 'FAILED' as const, message: error.message }

  return { ok: true as const }
}
