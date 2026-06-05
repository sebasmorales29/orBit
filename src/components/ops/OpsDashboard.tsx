import Link from 'next/link'
import { formatCents, type PlatformStats } from '@/lib/platform/platform-stats'
import { formatMoney } from '@/types/database'

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

export function OpsDashboard({ stats }: { stats: PlatformStats }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            orBit Platform
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Vista global de tenants, actividad y revenue. Actualizado{' '}
            {new Date(stats.generatedAt).toLocaleString('es-CR')}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ops/tenants/new"
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-on-accent"
          >
            + Crear tenant
          </Link>
          <Link
            href="/ops/tenants"
            className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-raised"
          >
            Ver tenants
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
          Plataforma
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tenants totales" value={String(stats.tenantsTotal)} />
          <StatCard
            label="Self-service"
            value={String(stats.tenantsSelfService)}
            hint="Registro + onboarding en la web"
          />
          <StatCard
            label="Provisionados (ops)"
            value={String(stats.tenantsOps)}
            hint="Creados desde orBit Platform"
          />
          <StatCard
            label="Onboarding pendiente"
            value={String(stats.onboardingInProgress)}
            hint="Cuenta creada, wizard sin terminar"
          />
          <StatCard label="Activos" value={String(stats.tenantsActive)} />
          <StatCard label="En trial" value={String(stats.tenantsTrial)} />
          <StatCard
            label="Suspendidos"
            value={String(stats.tenantsSuspended)}
            hint="No pueden operar si aplicás bloqueo"
          />
          <StatCard label="Usuarios (miembros)" value={String(stats.membersTotal)} />
          <StatCard label="Consultas abiertas" value={String(stats.leadsOpen)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
          Revenue y actividad (mes actual)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="MRR configurado"
            value={formatCents(stats.mrrCents, 'USD')}
            hint="Suma de cuotas mensuales que definís por tenant"
          />
          <StatCard
            label="GMV (ventas registradas)"
            value={formatMoney(stats.gmvThisMonth, stats.gmvCurrency)}
            hint="Suma de pedidos del mes — moneda mixta aproximada"
          />
          <StatCard
            label="Cobrado (marcado pagado)"
            value={formatMoney(stats.collectedThisMonth, stats.gmvCurrency)}
          />
          <StatCard label="Pedidos del mes" value={String(stats.ordersThisMonth)} />
        </div>
        <p className="mt-3 text-[12px] text-muted">
          Cobros self-service vía Tilopay (CR). Sin Stripe. En desarrollo local el pago se simula si falla la API.
          Editá plan y cuota en cada tenant si hace falta ajustar manualmente.
        </p>
      </section>
    </div>
  )
}
