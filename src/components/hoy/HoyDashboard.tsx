'use client'

import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAppOrg } from '@/components/app/AppOrgProvider'
import { useBusinessAdaptation } from '@/components/app/BusinessContextProvider'
import { HoyWelcomeBanner } from '@/components/hoy/HoyWelcomeBanner'
import { HoyWidgetRenderer, spanClass, widgetHasContent } from '@/components/hoy/HoyWidgetRenderer'
import { applyBusinessToLayout } from '@/lib/business-context/resolve'
import type { HoyDashboardData } from '@/lib/dashboard/hoy-data'
import { normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { DashboardLayout } from '@/lib/dashboard/types'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

interface HoyDashboardProps {
  data: HoyDashboardData
  layout: DashboardLayout
  /** Vista previa del studio: layout exacto, datos reales, sin banner */
  studioPreview?: boolean
  /** Panel guardado del tenant: no aplicar sugerencias automáticas del negocio */
  useSavedLayout?: boolean
}

export function HoyDashboard({ data, layout, studioPreview, useSavedLayout }: HoyDashboardProps) {
  const { t } = useTranslations()
  const org = useAppOrg()
  const adaptation = useBusinessAdaptation()
  const usesStock = org?.uses_stock ?? data.usesStock

  const layoutV2 = useMemo(() => {
    if (studioPreview || useSavedLayout) return normalizeLayout(layout, usesStock)
    return applyBusinessToLayout(layout, adaptation, usesStock)
  }, [layout, adaptation, usesStock, studioPreview, useSavedLayout])

  return (
    <>
      {!studioPreview && (
        <HoyWelcomeBanner orgName={data.orgName} profile={data.onboardingProfile} />
      )}
      <div className={cn(studioPreview ? 'space-y-4' : 'mt-6 space-y-5')}>
        {layoutV2.sections.map((sec) => {
          if (sec.collapsed && !studioPreview) return null

          const hasVisible = sec.rows.some((row) =>
            row.cells.some((c) => c.enabled)
          )
          if (!hasVisible) return null

          return (
            <div
              key={sec.id}
              className={cn(
                'overflow-hidden rounded-lg border border-[#243044] bg-[#0c1018] shadow-[0_4px_24px_rgb(0_0_0/0.35)]',
                studioPreview && sec.collapsed && 'opacity-55'
              )}
            >
              <div className="flex items-center gap-2 border-b border-[#243044] bg-[#151d2a] px-4 py-2.5">
                <ChevronDown className="h-3.5 w-3.5 text-[#00d4aa]" aria-hidden />
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#c5d9eb]">
                  {sec.title}
                </h2>
                {studioPreview && sec.collapsed && (
                  <span className="ml-auto rounded bg-[#243044] px-2 py-0.5 font-mono text-[9px] uppercase text-[#8eb4d4]">
                    {t('app.dashboard.studio.hiddenOnHoy')}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-3 sm:p-4">
                {sec.rows.map((row) => {
                  const activeCells = row.cells.filter((c) => {
                    if (!c.enabled) return false
                    if (studioPreview) return true
                    return widgetHasContent(c.widgetId, data)
                  })
                  if (activeCells.length === 0) return null

                  return (
                    <div key={row.id} className="grid grid-cols-12 gap-3">
                      {activeCells.map((cell) => (
                        <div key={cell.id} className={cn('min-h-[80px]', spanClass(cell.span))}>
                          <HoyWidgetRenderer
                            widgetId={cell.widgetId}
                            data={data}
                            framed
                            studioPreview={studioPreview}
                          />
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
