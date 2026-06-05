import { OpsMfaSetup } from '@/components/ops/OpsMfaSetup'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'
import { redirect } from 'next/navigation'

export default async function OpsMfaPage() {
  const status = await getOpsMfaStatus()

  if (!status) {
    redirect('/ops/login')
  }

  if (!status.mfaRequired) {
    redirect('/ops')
  }

  if (status.satisfied) {
    redirect('/ops')
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Verificación en dos pasos</h1>
      <p className="text-[14px] text-muted">
        La consola de operaciones requiere MFA. Configurá un autenticador (Google Authenticator,
        1Password, etc.) o verificá tu sesión.
      </p>
      <OpsMfaSetup
        hasVerifiedFactor={status.hasVerifiedFactor}
        sessionAal2={status.sessionAal2}
      />
    </div>
  )
}
