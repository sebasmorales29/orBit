import crypto from 'crypto'
import { assertSuperAdmin } from '@/lib/platform/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmailResend } from '@/lib/email/resend'

export type Purpose =
  | 'DISABLE_SUPER_ADMIN_MFA'
  | 'SUPER_ADMIN_CHANGE'
  | 'OPS_ACCESS_CHANGE'
  | 'DELETE_TENANT'
  | 'DELETE_USER'
  | 'UPDATE_USER'
  | 'SUSPEND_TENANT'
  | 'DEACTIVATE_USER'
  | 'REACTIVATE_USER'
  | 'ASSIGN_USER_TENANT'

export type StartEmailChallengeResult =
  | { ok: true; challengeId: string }
  | { ok: false; code: 'FORBIDDEN' | 'ADMIN_NOT_CONFIGURED' | 'FAILED'; message: string }

export type VerifyEmailChallengeResult =
  | { ok: true }
  | { ok: false; code: 'FORBIDDEN' | 'INVALID' | 'FAILED'; message: string }

type VerifyMode = 'preverify' | 'consume'

export async function assertSuperAdminAal2(): Promise<
  | { ok: true }
  | { ok: false; code: 'FORBIDDEN' | 'FAILED'; message: string }
> {
  try {
    const supabase = await createClient()
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel !== 'aal2') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Necesitás confirmar con tu MFA para continuar.',
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, code: 'FAILED', message: 'No se pudo validar MFA. Reintentá.' }
  }
}

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function startSuperAdminEmailChallenge(
  purpose: Purpose
): Promise<StartEmailChallengeResult> {
  const gate = await assertSuperAdmin()
  if (!gate.ok) {
    return { ok: false, code: 'FORBIDDEN', message: 'Solo el super admin puede ejecutar esto.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, code: 'ADMIN_NOT_CONFIGURED', message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }
  }

  const code = randomCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { data, error } = await admin
    .from('platform_security_email_challenges')
    .insert({
      email: gate.email,
      purpose,
      code_hash: hashCode(code),
      expires_at: expiresAt,
      created_by: gate.userId,
    })
    .select('id')
    .single()

  if (error || !data?.id) {
    return { ok: false, code: 'FAILED', message: error?.message ?? 'No se pudo crear el challenge.' }
  }

  const subject = `orBit Platform — Código de confirmación`
  const text = `Tu código de confirmación es: ${code}\n\nExpira en 10 minutos.\nSi vos no solicitaste esto, ignorá este correo.`

  const sent = await sendEmailResend({ to: gate.email, subject, text })
  if (!sent.ok) {
    return { ok: false, code: 'FAILED', message: sent.message }
  }

  return { ok: true, challengeId: data.id as string }
}

export async function verifySuperAdminEmailChallenge(input: {
  challengeId: string
  code: string
  expectedPurpose?: Purpose
  mode?: VerifyMode
}): Promise<VerifyEmailChallengeResult> {
  const gate = await assertSuperAdmin()
  if (!gate.ok) {
    return { ok: false, code: 'FORBIDDEN', message: 'Solo el super admin puede ejecutar esto.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, code: 'FAILED', message: 'Service role no configurado.' }
  }

  const { data: row, error } = await admin
    .from('platform_security_email_challenges')
    .select('*')
    .eq('id', input.challengeId)
    .maybeSingle()

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  if (!row) return { ok: false, code: 'INVALID', message: 'Challenge inválido.' }
  if (String(row.email).toLowerCase() !== gate.email.toLowerCase()) {
    return { ok: false, code: 'FORBIDDEN', message: 'Challenge no pertenece a tu cuenta.' }
  }
  if (row.consumed_at) return { ok: false, code: 'INVALID', message: 'Challenge ya fue usado.' }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, code: 'INVALID', message: 'Challenge expirado.' }
  }
  if (input.expectedPurpose && row.purpose !== input.expectedPurpose) {
    return { ok: false, code: 'INVALID', message: 'Challenge no coincide con la acción.' }
  }
  if ((row.attempts ?? 0) >= 5) {
    return { ok: false, code: 'INVALID', message: 'Demasiados intentos.' }
  }

  const ok = hashCode(input.code.trim()) === row.code_hash

  const mode: VerifyMode = input.mode ?? 'consume'

  await admin
    .from('platform_security_email_challenges')
    .update({
      attempts: (row.attempts ?? 0) + 1,
      consumed_at: ok && mode === 'consume' ? new Date().toISOString() : row.consumed_at,
      verified_at: ok ? new Date().toISOString() : row.verified_at,
    })
    .eq('id', row.id)

  if (!ok) return { ok: false, code: 'INVALID', message: 'Código incorrecto.' }
  return { ok: true }
}

export async function preverifySuperAdminEmailChallenge(input: {
  challengeId: string
  code: string
  expectedPurpose?: Purpose
}): Promise<VerifyEmailChallengeResult> {
  return verifySuperAdminEmailChallenge({ ...input, mode: 'preverify' })
}

