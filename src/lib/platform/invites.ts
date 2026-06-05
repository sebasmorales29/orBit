import crypto from 'crypto'
import { assertPlatformAdmin } from '@/lib/platform/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailResend } from '@/lib/email/resend'
import { assertCanAddTenantMember } from '@/lib/platform/tenant-access'
import { normalizeRoleForDb, ownerRoleBlockedMessage } from '@/lib/platform/owner-policy'

export type InviteStatus = 'pending' | 'member' | 'revoked' | 'expired'

export type InviteRole = 'owner' | 'administrator' | 'member' | 'visitor'

export type InviteRow = {
  id: string
  organization_id: string
  email: string
  role: InviteRole
  status: InviteStatus
  invited_by_email: string | null
  invited_by_name: string | null
  invited_at: string
  accepted_at: string | null
}

export type ListInvitesResult =
  | { ok: true; invites: InviteRow[] }
  | { ok: false; code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED' | 'FAILED'; message: string }

export type CreateInviteResult =
  | { ok: true; invite: InviteRow }
  | { ok: false; code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED' | 'FAILED' | 'INVALID_INPUT'; message: string }

function randomToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

function randomTempPassword(): string {
  // suficientemente fuerte para 1er login, pero “human‑typeable”
  return `${crypto.randomBytes(6).toString('base64url')}!A7`
}

async function findUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase()
  let page = 1
  const perPage = 200
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return null
    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match) return match.id
    if (data.users.length < perPage) break
    page += 1
  }
  return null
}

export async function listTenantInvites(orgId: string): Promise<ListInvitesResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, code: 'NOT_AUTHORIZED', message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, code: 'ADMIN_NOT_CONFIGURED', message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { data, error } = await admin
    .from('organization_invites')
    .select('*')
    .eq('organization_id', orgId)
    .order('invited_at', { ascending: false })

  if (error) return { ok: false, code: 'FAILED', message: error.message }

  const invites: InviteRow[] = (data ?? []).map((r) => ({
    id: r.id,
    organization_id: r.organization_id,
    email: r.email,
    role: (r.role === 'admin' ? 'administrator' : r.role) as InviteRole,
    status: r.status as InviteStatus,
    invited_by_email: r.invited_by_email ?? null,
    invited_by_name: r.invited_by_name ?? null,
    invited_at: r.invited_at,
    accepted_at: r.accepted_at ?? null,
  }))

  return { ok: true, invites }
}

export async function inviteUserToTenant(input: {
  organizationId: string
  organizationName: string
  inviterEmail: string
  inviterName: string
  email: string
  role: InviteRole
  expiresIn: '1h' | '24h' | '7d' | '30d'
}): Promise<CreateInviteResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, code: 'NOT_AUTHORIZED', message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, code: 'ADMIN_NOT_CONFIGURED', message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Correo inválido.' }
  }

  if (normalizeRoleForDb(input.role) === 'owner') {
    return { ok: false, code: 'INVALID_INPUT', message: ownerRoleBlockedMessage() }
  }

  const access = await assertCanAddTenantMember({
    organizationId: input.organizationId,
    email,
  })
  if (!access.ok) {
    return { ok: false, code: 'INVALID_INPUT', message: access.message }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const token = randomToken()
  const inviteLink = `${appUrl}/invite/${token}`
  const ttlMs =
    input.expiresIn === '1h'
      ? 60 * 60 * 1000
      : input.expiresIn === '24h'
        ? 24 * 60 * 60 * 1000
        : input.expiresIn === '30d'
          ? 30 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000
  const expiresAtIso = new Date(Date.now() + ttlMs).toISOString()

  // Si el usuario no existe, lo creamos con contraseña temporal y forzamos cambio.
  let tempPassword: string | null = null
  const existingUserId = await findUserIdByEmail(admin, email)
  if (!existingUserId) {
    tempPassword = randomTempPassword()
    const { error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    })
    if (error) {
      return { ok: false, code: 'FAILED', message: error.message }
    }
  }

  const dbRole = input.role === 'administrator' ? 'admin' : input.role

  const { data, error } = await admin
    .from('organization_invites')
    .upsert(
      {
        organization_id: input.organizationId,
        email,
        role: dbRole,
        status: 'pending',
        token,
        temp_password_set: Boolean(tempPassword),
        invited_by_user_id: gate.userId,
        invited_by_email: input.inviterEmail,
        invited_by_name: input.inviterName,
        invited_at: new Date().toISOString(),
        accepted_at: null,
        revoked_at: null,
        expires_at: expiresAtIso,
      },
      { onConflict: 'organization_id,email' }
    )
    .select('*')
    .single()

  if (error || !data) {
    const msg = error?.message ?? 'No se pudo crear invite.'
    if (msg.includes('invalid input value for enum member_role') && msg.includes('visitor')) {
      return {
        ok: false,
        code: 'FAILED',
        message:
          'Tu base de datos aún no tiene el rol "visitor" en el enum member_role. Ejecutá la migración `20250530231000_add_visitor_role.sql` en Supabase y reintentá.',
      }
    }
    return { ok: false, code: 'FAILED', message: msg }
  }

  const subject = `orBit — Invitación a ${input.organizationName}`
  const lines = [
    `Te invitaron a un tenant de orBit: ${input.organizationName}`,
    ``,
    `Invitado por: ${input.inviterName} <${input.inviterEmail}>`,
    ``,
    `Link de acceso al tenant:`,
    inviteLink,
    ``,
    `Vigencia del link: ${input.expiresIn}`,
    ``,
  ]

  if (tempPassword) {
    lines.push(
      `Tu contraseña temporal: ${tempPassword}`,
      `Al iniciar sesión, orBit te va a pedir cambiarla por una tuya.`,
      ``
    )
  } else {
    lines.push(`Usá tu contraseña actual para iniciar sesión.`, ``)
  }

  lines.push(`Si no esperabas esto, ignorá este correo.`)

  const sent = await sendEmailResend({
    to: email,
    subject,
    text: lines.join('\n'),
  })
  if (!sent.ok) {
    // Si no se pudo enviar el correo, no dejamos el invite “colgado”.
    await admin.from('organization_invites').delete().eq('id', data.id)
    return { ok: false, code: 'FAILED', message: sent.message }
  }

  const invite: InviteRow = {
    id: data.id,
    organization_id: data.organization_id,
    email: data.email,
    role: (data.role === 'admin' ? 'administrator' : data.role) as InviteRole,
    status: data.status as InviteStatus,
    invited_by_email: data.invited_by_email ?? null,
    invited_by_name: data.invited_by_name ?? null,
    invited_at: data.invited_at,
    accepted_at: data.accepted_at ?? null,
  }

  return { ok: true, invite }
}

export async function acceptInvite(token: string, session: { userId: string; email: string }) {
  const admin = createAdminClient()
  if (!admin) return { ok: false as const, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { data: invite, error } = await admin
    .from('organization_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) return { ok: false as const, message: error.message }
  if (!invite) return { ok: false as const, message: 'Invitación inválida.' }
  if (invite.status !== 'pending') return { ok: false as const, message: 'Invitación no disponible.' }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await admin.from('organization_invites').update({ status: 'expired' }).eq('id', invite.id)
    return { ok: false as const, message: 'Invitación expirada.' }
  }
  if (String(invite.email).toLowerCase() !== session.email.toLowerCase()) {
    return { ok: false as const, message: 'Esta invitación no corresponde a tu correo.' }
  }

  const role = invite.role === 'admin' ? 'admin' : invite.role

  // Inserta membresía (single-tenant: borra previas).
  await admin.from('organization_members').delete().eq('user_id', session.userId)

  const { error: memberErr } = await admin.from('organization_members').insert({
    organization_id: invite.organization_id,
    user_id: session.userId,
    role,
  })
  if (memberErr) return { ok: false as const, message: memberErr.message }

  await admin
    .from('organization_invites')
    .update({ status: 'member', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  // Si el usuario debía cambiar contraseña, lo dejamos; el middleware lo mandará a /change-password.
  return { ok: true as const, organizationId: invite.organization_id as string }
}

export async function getInviteWelcome(token: string): Promise<
  | {
      ok: true
      invite: {
        email: string
        status: 'pending' | 'member' | 'revoked' | 'expired'
        expires_at: string
        invited_by_name: string | null
        invited_by_email: string | null
        organization: { id: string; name: string }
      }
    }
  | { ok: false; message: string }
> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { data: invite, error } = await admin
    .from('organization_invites')
    .select('email, status, expires_at, invited_by_name, invited_by_email, organization_id')
    .eq('token', token)
    .maybeSingle()

  if (error) return { ok: false, message: error.message }
  if (!invite) return { ok: false, message: 'Invitación inválida.' }

  const expired = new Date(invite.expires_at).getTime() < Date.now()
  if (invite.status === 'pending' && expired) {
    await admin.from('organization_invites').update({ status: 'expired' }).eq('token', token)
    return { ok: false, message: 'Invitación expirada.' }
  }
  if (invite.status !== 'pending') {
    return { ok: false, message: 'Invitación no disponible.' }
  }

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .select('id, name')
    .eq('id', invite.organization_id)
    .maybeSingle()
  if (orgErr) return { ok: false, message: orgErr.message }
  if (!org) return { ok: false, message: 'Tenant no encontrado.' }

  return {
    ok: true,
    invite: {
      email: invite.email,
      status: invite.status,
      expires_at: invite.expires_at,
      invited_by_name: invite.invited_by_name ?? null,
      invited_by_email: invite.invited_by_email ?? null,
      organization: { id: org.id, name: org.name },
    },
  }
}

