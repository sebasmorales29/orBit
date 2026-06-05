import { getSuperAdminEmail } from '@/lib/platform/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function establishSuperAdminSession(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const email = getSuperAdminEmail()
  if (!email) {
    return { ok: false, message: 'Super admin no configurado.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, message: 'Service role no configurado.' }
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    return { ok: false, message: error?.message ?? 'No se pudo iniciar sesión.' }
  }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  })

  if (verifyError) {
    return { ok: false, message: verifyError.message }
  }

  return { ok: true }
}
