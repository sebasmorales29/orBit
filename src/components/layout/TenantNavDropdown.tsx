'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Building2, Check } from 'lucide-react'
import { useAppOrg, useTenantOrganizations } from '@/components/app/AppOrgProvider'
import { setActiveOrganizationId } from '@/lib/org-actions'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function TenantNavDropdown() {
  const router = useRouter()
  const { t } = useTranslations()
  const toast = useToast()
  const org = useAppOrg()
  const organizations = useTenantOrganizations()
  const [open, setOpen] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeOrgId = org?.id ?? null
  const activeOrg = organizations.find((o) => o.id === activeOrgId)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (organizations.length <= 1) return null

  async function switchTenant(orgId: string) {
    if (!orgId || orgId === activeOrgId || savingId) return
    setSavingId(orgId)
    const res = await setActiveOrganizationId({ organizationId: orgId })
    if (res.ok) {
      setOpen(false)
      toast.success(t('app.settings.tenantSwitched'))
      router.push('/hoy')
      router.refresh()
    } else {
      setSavingId(null)
      toast.error(res.message)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={Boolean(savingId)}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-full border border-border bg-surface-raised px-2 py-1.5 text-left transition-colors hover:bg-surface-hover sm:max-w-[min(220px,38vw)] sm:px-3',
          open && 'border-accent/40 bg-surface-hover'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('app.settings.switchTenant')}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="hidden min-w-0 max-w-[140px] flex-1 truncate text-[13px] font-medium text-foreground md:inline">
          {activeOrg?.name ?? t('app.settings.switchTenant')}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('app.settings.organization')}
            </p>
            <p className="mt-1 text-[12px] text-muted">{t('app.settings.switchTenantDescription')}</p>
          </div>
          <ul role="listbox" className="max-h-[min(280px,50dvh)] overflow-y-auto py-1">
            {organizations.map((item) => {
              const isActive = item.id === activeOrgId
              const isSaving = savingId === item.id
              return (
                <li key={item.id} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    disabled={Boolean(savingId)}
                    onClick={() => void switchTenant(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover',
                      isActive && 'bg-accent/10',
                      isSaving && 'opacity-70'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                        isActive
                          ? 'border-accent/40 bg-accent/10 text-accent'
                          : 'border-border bg-surface-raised text-muted'
                      )}
                    >
                      <Building2 className="h-4 w-4" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {item.name}
                      </span>
                      {isActive && (
                        <span className="mt-0.5 block text-[11px] text-accent">
                          {t('app.tenant.activeNow')}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
