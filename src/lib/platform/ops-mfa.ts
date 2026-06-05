import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getOpsSessionAccess, resolveOpsAccess } from '@/lib/platform/ops-access'

export type OpsMfaStatus = {
  mfaRequired: boolean
  hasVerifiedFactor: boolean
  sessionAal2: boolean
  satisfied: boolean
}

export async function buildOpsMfaStatus(
  supabase: SupabaseClient,
  mfaRequired: boolean
): Promise<OpsMfaStatus> {
  const { data: factorsData } = await supabase.auth.mfa.listFactors()
  const hasVerifiedFactor = (factorsData?.totp ?? []).some((f) => f.status === 'verified')

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const sessionAal2 = aal?.currentLevel === 'aal2'

  const satisfied = !mfaRequired || (hasVerifiedFactor && sessionAal2)

  return {
    mfaRequired,
    hasVerifiedFactor,
    sessionAal2,
    satisfied,
  }
}

/** Estado MFA para la sesión actual en /ops */
export async function getOpsMfaStatus(): Promise<OpsMfaStatus | null> {
  const access = await getOpsSessionAccess()
  if (!access) return null

  const supabase = await createClient()
  return buildOpsMfaStatus(supabase, access.mfaRequired)
}

export async function getOpsMfaStatusForEmail(
  supabase: SupabaseClient,
  email: string
): Promise<OpsMfaStatus | null> {
  const access = await resolveOpsAccess(email)
  if (!access.allowed) return null
  return buildOpsMfaStatus(supabase, access.mfaRequired)
}
