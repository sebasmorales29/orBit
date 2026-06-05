import { notFound } from 'next/navigation'
import { OpsUserDetail } from '@/components/ops/OpsUserDetail'
import { isSuperAdminEmail } from '@/lib/platform/admin'
import { queryProvisionedTenants } from '@/lib/platform/provision-tenant'
import { getSessionActor } from '@/lib/platform/session-actor'
import { queryPlatformUserDetail } from '@/lib/platform/users-admin'

export default async function OpsUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = await queryPlatformUserDetail(id)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') notFound()
    return <p className="text-[14px] text-red-600">{result.message}</p>
  }

  const tenantsResult = await queryProvisionedTenants()
  const tenants =
    tenantsResult.ok
      ? tenantsResult.tenants.map((t) => ({ id: t.id, name: t.name }))
      : []

  const actor = await getSessionActor()
  const canDelete = actor ? isSuperAdminEmail(actor.email) : false

  return <OpsUserDetail user={result.user} canDelete={canDelete} tenants={tenants} />
}

