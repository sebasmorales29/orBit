'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TenantPickerModal, type TenantPickerOrg } from '@/components/app/TenantPickerModal'
import { setActiveOrganizationId } from '@/lib/org-actions'

export type { TenantPickerOrg }

export function TenantPickerGate({
  orgs,
  activeOrgId,
}: {
  orgs: TenantPickerOrg[]
  activeOrgId: string | null
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const shouldPick = useMemo(() => {
    if (orgs.length <= 1) return false
    if (!activeOrgId) return true
    return !orgs.some((o) => o.id === activeOrgId)
  }, [orgs, activeOrgId])

  const pick = async (orgId: string) => {
    if (saving) return
    setSaving(true)
    const res = await setActiveOrganizationId({ organizationId: orgId })
    if (res.ok) {
      router.refresh()
    } else {
      setSaving(false)
      alert(res.message)
    }
  }

  return (
    <TenantPickerModal
      open={shouldPick && !saving}
      orgs={orgs}
      activeOrgId={activeOrgId}
      title="Elegí un tenant"
      description="Tenés acceso a más de una organización. Seleccioná con cuál querés trabajar."
      confirmLabel="Entrar"
      loading={saving}
      onPick={(orgId) => pick(orgId)}
    />
  )
}
