import Link from 'next/link'
import { OpsConfigNotice } from '@/components/ops/OpsConfigNotice'
import { OpsSchemaNotice } from '@/components/ops/OpsSchemaNotice'
import { opsCheckSchema } from '@/lib/platform/actions'
import { listProvisionedTenants } from '@/lib/platform/provision-tenant'
import { Button } from '@/components/ui/Button'

export default async function OpsTenantsPage() {
  const schema = await opsCheckSchema()
  if (!schema.ok) {
    return <OpsSchemaNotice missingColumns={schema.missingColumns} sqlFix={schema.sqlFix} />
  }

  const result = await listProvisionedTenants()

  if (!result.ok) {
    if (result.code === 'ADMIN_NOT_CONFIGURED') {
      return <OpsConfigNotice />
    }
    return <p className="text-[14px] text-red-600 dark:text-red-400">{result.message}</p>
  }

  const { tenants } = result

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tenants</h1>
          <p className="mt-1 text-[14px] text-muted">
            Negocios aprovisionados en orBit. Cada fila es una organización aislada.
          </p>
        </div>
        <Link href="/ops/tenants/new">
          <Button>Crear tenant</Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-[14px] text-muted">Todavía no hay tenants creados desde ops.</p>
          <Link href="/ops/tenants/new" className="mt-4 inline-block">
            <Button variant="secondary">Crear el primero</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-raised text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Origen</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Plan</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Owner</th>
                <th className="px-4 py-3 font-medium">Miembros</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Plan</th>
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
      )}
    </div>
  )
}
