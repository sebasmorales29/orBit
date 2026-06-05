import Link from 'next/link'
import { assertSuperAdmin } from '@/lib/platform/admin'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'
import { redirect } from 'next/navigation'
import { OpsSettingsClient } from '@/components/ops/OpsSettingsClient'

export default async function OpsSettingsPage() {
  const gate = await assertSuperAdmin()
  if (!gate.ok) redirect('/ops')

  const status = await getOpsMfaStatus()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuraciones</h1>
        <p className="mt-1 text-[13px] text-muted">Preferencias y seguridad del panel de operaciones.</p>
      </div>

      <OpsSettingsClient />

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-[14px] font-medium text-foreground">Seguridad</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-raised p-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              MFA requerido
            </p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">
              {status?.mfaRequired ? 'Sí' : 'No'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-raised p-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Factor verificado
            </p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">
              {status?.hasVerifiedFactor ? 'Sí' : 'No'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-raised p-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Sesión AAL2
            </p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">
              {status?.sessionAal2 ? 'Sí' : 'No'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/ops/mfa"
            className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-hover"
          >
            Verificar / configurar MFA
          </Link>
          <Link
            href="/ops/access"
            className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-hover"
          >
            Operadores y acceso
          </Link>
        </div>
      </section>
    </div>
  )
}

