import Link from 'next/link'
import { opsListContactRequests } from '@/lib/platform/actions'
import { OpsContactRequests } from '@/components/ops/OpsContactRequests'

export default async function OpsInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const showArchived = params.archived === '1'
  const result = await opsListContactRequests(showArchived)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Solicitudes de contacto</h1>
          <p className="mt-1 text-[14px] text-muted">
            Leads desde el landing público. Procesá cada solicitud en detalle.
          </p>
        </div>
        <Link
          href={showArchived ? '/ops/inquiries' : '/ops/inquiries?archived=1'}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          {showArchived ? 'Ver activas' : 'Ver archivadas'}
        </Link>
      </header>

      {!result.ok ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[13px] text-muted">
          {result.message}
          {result.message.includes('does not exist') && (
            <>
              {' '}
              Ejecutá{' '}
              <code className="text-foreground">20250530270000_platform_contacts_tenant_access.sql</code>
            </>
          )}
        </p>
      ) : (
        <OpsContactRequests requests={result.requests} />
      )}
    </div>
  )
}
