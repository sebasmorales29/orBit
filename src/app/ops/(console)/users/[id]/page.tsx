import { notFound } from 'next/navigation'
import { OpsUserDetail } from '@/components/ops/OpsUserDetail'
import { assertPlatformAdmin } from '@/lib/platform/admin'
import { listProvisionedTenants } from '@/lib/platform/provision-tenant'
import { getPlatformUserDetail } from '@/lib/platform/users-admin'

export default async function OpsUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = await getPlatformUserDetail(id)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') notFound()
    return <p className="text-[14px] text-red-600">{result.message}</p>
  }

  const tenantsResult = await listProvisionedTenants()
  const tenants =
    tenantsResult.ok
      ? tenantsResult.tenants.map((t) => ({ id: t.id, name: t.name }))
      : []

  const gate = await assertPlatformAdmin()
  const canDelete = gate.ok && gate.isSuper

  return <OpsUserDetail user={result.user} canDelete={canDelete} tenants={tenants} />
}

