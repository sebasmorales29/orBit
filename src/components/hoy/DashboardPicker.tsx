'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LayoutDashboard, Lock, Users } from 'lucide-react'
import type { TenantDashboardListItem } from '@/lib/dashboard/tenant-dashboards'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

interface DashboardPickerProps {
  dashboards: TenantDashboardListItem[]
  activeId: string | null
  loading?: boolean
  onSelect: (id: string) => void
  onCreateNew: () => void
}

export function DashboardPicker({
  dashboards,
  activeId,
  loading,
  onSelect,
  onCreateNew,
}: DashboardPickerProps) {
  const { t } = useTranslations()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = dashboards.find((d) => d.id === activeId)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex max-w-[min(200px,42vw)] items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-left transition-colors hover:bg-surface-hover',
          open && 'border-accent/40 bg-surface-hover'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('app.dashboard.picker.label')}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
        <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
          {active?.name ?? t('app.dashboard.picker.none')}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 max-h-[min(320px,60dvh)] w-[min(280px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface py-1 shadow-lg"
        >
          {dashboards.map((d) => (
            <li key={d.id} role="option" aria-selected={d.id === activeId}>
              <button
                type="button"
                onClick={() => {
                  onSelect(d.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover',
                  d.id === activeId && 'bg-accent/10'
                )}
              >
                <span className="mt-0.5 shrink-0 text-muted">
                  {d.visibility === 'public' ? (
                    <Users className="h-4 w-4 text-accent" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground">
                    {d.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {d.is_mine
                      ? d.visibility === 'public'
                        ? t('app.dashboard.picker.minePublic')
                        : t('app.dashboard.picker.minePrivate')
                      : t('app.dashboard.picker.sharedPublic')}
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-border-subtle">
            <button
              type="button"
              onClick={() => {
                onCreateNew()
                setOpen(false)
              }}
              className="w-full px-3 py-2.5 text-left text-[13px] font-medium text-accent hover:bg-surface-hover"
            >
              + {t('app.dashboard.picker.new')}
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
