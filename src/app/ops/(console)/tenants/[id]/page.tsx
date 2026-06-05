import { notFound } from 'next/navigation'
import { OpsSchemaNotice } from '@/components/ops/OpsSchemaNotice'
import { OpsTenantDetail } from '@/components/ops/OpsTenantDetail'
import { opsGetTenant } from '@/lib/platform/actions'
import { assertPlatformAdmin } from '@/lib/platform/admin'

export default async function OpsTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await opsGetTenant(id)

  if (!result.ok) {
    if (result.code === 'SCHEMA' && result.sqlFix) {
      const missing = result.message.replace(/^.*: /, '').split(', ')
      return <OpsSchemaNotice missingColumns={missing} sqlFix={result.sqlFix} />
    }
    if (result.code === 'NOT_FOUND') notFound()
    return <p className="text-[14px] text-red-600">{result.message}</p>
  }

  const gate = await assertPlatformAdmin()
  const canDelete = gate.ok && gate.isSuper

  return <OpsTenantDetail tenant={result.data} canDelete={canDelete} />
}
