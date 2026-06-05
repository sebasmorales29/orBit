import { redirect } from 'next/navigation'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { OpsMfaSetup } from '@/components/ops/OpsMfaSetup'
import { assertPlatformAdmin } from '@/lib/platform/admin'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'

function safeOpsNext(next: string | string[] | undefined): string {
  const raw = typeof next === 'string' ? next : '/ops'
  if (!raw.startsWith('/ops')) return '/ops'
  return raw
}

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = safeOpsNext(params.next)
  const gate = await assertPlatformAdmin()

  if (!gate.ok) {
    const title =
      gate.reason === 'forbidden'
        ? 'Sin permiso'
        : gate.reason === 'not_configured'
          ? 'Ops no configurado'
          : 'Enlace requerido'

    const body =
      gate.reason === 'forbidden'
        ? 'Tu cuenta no tiene acceso a Operaciones. Pedile acceso al super administrador de orBit.'
        : gate.reason === 'not_configured'
          ? 'Falta configurar ORBIT_PLATFORM_SUPER_ADMIN_EMAIL y SUPABASE_SERVICE_ROLE_KEY en el servidor.'
          : 'Abrí tu enlace privado de entrada o iniciá sesión en orBit con la cuenta de super administrador.'

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
            <h1 className="mt-6 text-2xl font-semibold text-foreground">{title}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{body}</p>
            {gate.reason === 'unauthenticated' && (
              <>
                <p className="mt-4 text-[13px] font-medium text-foreground">Opción 1 — enlace privado:</p>
                <p className="mt-2 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-[12px] text-foreground">
                  /ops/entry/TU_TOKEN
                </p>
                <p className="mt-4 text-[13px] font-medium text-foreground">Opción 2 — ya tenés cuenta:</p>
                <p className="mt-2 text-[13px] text-muted">
                  Iniciá sesión en{' '}
                  <a href={`/login?next=${encodeURIComponent(next)}`} className="text-accent hover:underline">
                    orBit
                  </a>{' '}
                  con el correo de super administrador y volvé a esta página.
                </p>
              </>
            )}
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
          No se pudo validar tu acceso. Cerrá sesión, volvé a abrir tu enlace de entrada o iniciá sesión de nuevo.
        </div>
      </div>
    )
  }

  if (!status.mfaRequired || status.satisfied) {
    redirect(next)
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
            Sesión válida como <span className="text-foreground">{gate.email}</span>. Completá MFA para entrar.
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-foreground">Código de autenticador</h1>
          <p className="mt-2 text-[13px] text-muted">
            Ingresá el código de 6 dígitos de tu app de autenticación para entrar a Operaciones.
          </p>

          <div className="mt-6">
            <OpsMfaSetup
              hasVerifiedFactor={status.hasVerifiedFactor}
              sessionAal2={status.sessionAal2}
              nextHref={next}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
