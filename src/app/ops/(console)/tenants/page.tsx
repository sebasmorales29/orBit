import Link from 'next/link'
import { OpsConfigNotice } from '@/components/ops/OpsConfigNotice'
import { OpsSchemaNotice } from '@/components/ops/OpsSchemaNotice'
import { OpsTenantsTable } from '@/components/ops/OpsTenantsTable'
import { checkPlatformSchema } from '@/lib/platform/schema-health'
import { queryProvisionedTenants } from '@/lib/platform/provision-tenant'
import {
  filterTenantRows,
  parseTenantListFilter,
  tenantFilterLabel,
} from '@/lib/platform/tenant-filters'
import { Button } from '@/components/ui/Button'

export default async function OpsTenantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filter = parseTenantListFilter(params)
  const filterLabel = tenantFilterLabel(filter)

  const schema = await checkPlatformSchema()
  if (!schema.ok) {
    return <OpsSchemaNotice missingColumns={schema.missingColumns} sqlFix={schema.sqlFix} />
  }

  const result = await queryProvisionedTenants()

  if (!result.ok) {
    if (result.code === 'ADMIN_NOT_CONFIGURED') {
      return <OpsConfigNotice />
    }
    return <p className="text-[14px] text-red-600 dark:text-red-400">{result.message}</p>
  }

  const tenants = filterTenantRows(result.tenants, filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tenants</h1>
          <p className="mt-1 text-[14px] text-muted">
            Negocios aprovisionados en orBit. Cada fila es una organización aislada.
          </p>
          {filterLabel && (
            <p className="mt-2 text-[13px] text-accent">
              Filtro: <span className="font-medium">{filterLabel}</span>
              {' · '}
              <Link href="/ops/tenants" className="underline hover:opacity-80">
                Quitar filtro
              </Link>
            </p>
          )}
        </div>
        <Link href="/ops/tenants/new">
          <Button>Crear tenant</Button>
        </Link>
      </div>

      {result.tenants.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-[14px] text-muted">Todavía no hay tenants creados.</p>
          <Link href="/ops/tenants/new" className="mt-4 inline-block">
            <Button variant="secondary">Crear el primero</Button>
          </Link>
        </div>
      ) : (
        <OpsTenantsTable tenants={tenants} />
      )}
    </div>
  )
}
