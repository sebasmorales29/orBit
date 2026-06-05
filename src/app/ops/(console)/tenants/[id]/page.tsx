import { notFound } from 'next/navigation'
import { OpsSchemaNotice } from '@/components/ops/OpsSchemaNotice'
import { OpsTenantDetail } from '@/components/ops/OpsTenantDetail'
import { queryTenantDetail } from '@/lib/platform/tenant-admin'
import { isSuperAdminEmail } from '@/lib/platform/admin'
import { getSessionActor } from '@/lib/platform/session-actor'

export default async function OpsTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await queryTenantDetail(id)

  if (!result.ok) {
    if (result.code === 'SCHEMA' && result.sqlFix) {
      const missing = result.message.replace(/^.*: /, '').split(', ')
      return <OpsSchemaNotice missingColumns={missing} sqlFix={result.sqlFix} />
    }
    if (result.code === 'NOT_FOUND') notFound()
    return <p className="text-[14px] text-red-600">{result.message}</p>
  }

  const actor = await getSessionActor()
  const canDelete = actor ? isSuperAdminEmail(actor.email) : false

  return <OpsTenantDetail tenant={result.data} canDelete={canDelete} />
}
