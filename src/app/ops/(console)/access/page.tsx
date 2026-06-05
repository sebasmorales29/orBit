import { redirect } from 'next/navigation'
import { OpsAccessClient } from '@/components/ops/OpsAccessClient'
import { assertSuperAdmin } from '@/lib/platform/admin'
import { queryOpsAdmins } from '@/lib/platform/ops-access'

export default async function OpsAccessPage() {
  const gate = await assertSuperAdmin()
  if (!gate.ok) {
    redirect('/ops')
  }

  const result = await queryOpsAdmins()
  if (!result.ok) {
    return <p className="text-[14px] text-red-600">{result.message}</p>
  }

  return <OpsAccessClient admins={result.data} />
}
