import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { OpsMfaSetup } from '@/components/ops/OpsMfaSetup'
import { OPS_ENTRY_COOKIE } from '@/lib/platform/ops-cookie'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const entryExpired = params.reason === 'entry'
  const cookieStore = await cookies()
  const hasEntry = cookieStore.get(OPS_ENTRY_COOKIE)?.value === '1'

  if (!hasEntry) {
    return (
      <div className="min-h-dvh bg-page px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <BrandLogo href="/" size={40} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Ops</p>
                <p className="text-[14px] font-semibold text-foreground">Acceso privado</p>
              </div>
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-foreground">
              {entryExpired ? 'Acceso expirado' : 'Enlace requerido'}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {entryExpired
                ? 'Tu acceso a Ops expiró o la cookie de entrada no está activa. Volvé a abrir tu enlace privado de entrada.'
                : 'Esta consola no tiene inicio de sesión público. Usá el enlace de acceso privado de orBit.'}
            </p>
            <p className="mt-3 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-[12px] text-foreground">
              /ops/entry/TU_TOKEN
            </p>
          </div>
        </div>
      </div>
    )
  }

  const status = await getOpsMfaStatus()

  if (!status) {
    return (
      <div className="min-h-dvh bg-page px-4 py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-6 text-[13px] text-muted">
          No se pudo validar tu acceso. Volvé a abrir tu enlace de entrada privado.
        </div>
      </div>
    )
  }

  if (!status.mfaRequired || status.satisfied) {
    redirect('/ops')
  }

  return (
    <div className="min-h-dvh bg-page px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size={40} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Ops</p>
              <p className="text-[14px] font-semibold text-foreground">Verificación MFA</p>
            </div>
          </div>

          <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-muted">
            Enlace de entrada aceptado. Este es el último paso antes de Operaciones.
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-foreground">Código de autenticador</h1>
          <p className="mt-2 text-[13px] text-muted">
            Ingresá el código de 6 dígitos de tu app de autenticación para entrar a Operaciones.
          </p>

          <div className="mt-6">
            <OpsMfaSetup
              hasVerifiedFactor={status.hasVerifiedFactor}
              sessionAal2={status.sessionAal2}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
