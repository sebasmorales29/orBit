'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { TenantPickerModal, type TenantPickerOrg } from '@/components/app/TenantPickerModal'
import { setActiveOrganizationId } from '@/lib/org-actions'
import { Button } from '@/components/ui/Button'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useToast } from '@/components/ui/toast'

export function TenantSwitcher({
  orgs,
  activeOrgId,
  currentOrgName,
}: {
  orgs: TenantPickerOrg[]
  activeOrgId: string
  currentOrgName: string
}) {
  const router = useRouter()
  const { t } = useTranslations()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  if (orgs.length <= 1) return null

  const switchTenant = async (orgId: string) => {
    if (saving || orgId === activeOrgId) return
    setSaving(true)
    const res = await setActiveOrganizationId({ organizationId: orgId })
    if (res.ok) {
      setOpen(false)
      toast.success(t('app.settings.tenantSwitched'))
      router.push('/hoy')
      router.refresh()
    } else {
      setSaving(false)
      toast.error(res.message)
    }
  }

  return (
    <>
      <TenantPickerModal
        open={open}
        orgs={orgs}
        activeOrgId={activeOrgId}
        title={t('app.settings.switchTenantTitle')}
        description={t('app.settings.switchTenantDescription')}
        confirmLabel={t('app.settings.switchTenantConfirm')}
        cancelLabel={t('common.cancel')}
        loading={saving}
        onPick={switchTenant}
        onCancel={() => !saving && setOpen(false)}
      />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised">
          <Building2 className="h-4 w-4 text-muted" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-foreground">{currentOrgName}</p>
          <p className="mt-1 text-[12px] text-muted">{t('app.settings.activeTenantHint')}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 px-4 py-2 text-[12px]"
            onClick={() => setOpen(true)}
          >
            {t('app.settings.switchTenant')}
          </Button>
        </div>
      </div>
    </>
  )
}
