import Link from 'next/link'
import type { TenantListRow } from '@/lib/platform/types'

export function OpsTenantsTable({ tenants }: { tenants: TenantListRow[] }) {
  if (tenants.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-[14px] text-muted">No hay tenants que coincidan con este filtro.</p>
        <Link
          href="/ops/tenants"
          className="mt-4 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          Ver todos los tenants
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-raised text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Negocio</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Origen</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Plan</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Owner</th>
            <th className="px-4 py-3 font-medium">Miembros</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Estado</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Creado</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b border-border-subtle last:border-0">
              <td className="px-4 py-3">
                <Link href={`/ops/tenants/${t.id}`} className="block hover:opacity-90">
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted">{t.business_type ?? '—'}</p>
                </Link>
              </td>
              <td className="hidden px-4 py-3 capitalize text-muted sm:table-cell">
                {t.provisioned_source === 'ops' ? 'Ops' : 'Self-service'}
              </td>
              <td className="hidden px-4 py-3 capitalize text-muted md:table-cell">
                {t.selected_plan ?? t.plan_tier}
                {!t.onboarding_completed && (
                  <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-400">
                    · onboarding
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <p className="text-foreground">{t.ownerName ?? '—'}</p>
                <p className="text-[12px] text-muted">{t.ownerEmail ?? '—'}</p>
              </td>
              <td className="px-4 py-3 text-muted">{t.memberCount}</td>
              <td className="hidden px-4 py-3 capitalize text-muted md:table-cell">
                {t.plan_tier} · {t.platform_status}
              </td>
              <td className="hidden px-4 py-3 text-muted lg:table-cell">
                {new Date(t.created_at).toLocaleDateString('es-CR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
