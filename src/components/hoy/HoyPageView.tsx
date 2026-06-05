'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { DashboardStudio } from '@/components/dashboard/studio/DashboardStudio'
import { DashboardPicker } from '@/components/hoy/DashboardPicker'
import { HoyDashboard } from '@/components/hoy/HoyDashboard'
import { createDefaultLayout, storageKey } from '@/lib/dashboard/defaults'
import { normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { HoyDashboardData } from '@/lib/dashboard/hoy-data'
import type { DashboardLayoutV2 } from '@/lib/dashboard/types'
import {
  activateTenantDashboard,
  createTenantDashboard,
  ensureDefaultTenantDashboard,
  listTenantDashboards,
  updateTenantDashboard,
  type DashboardVisibility,
  type TenantDashboardListItem,
} from '@/lib/dashboard/tenant-dashboards'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useToast } from '@/components/ui/toast'

export function HoyPageView({ data }: { data: HoyDashboardData }) {
  const { t } = useTranslations()
  const toast = useToast()
  const [layout, setLayout] = useState<DashboardLayoutV2>(() =>
    normalizeLayout(data.layout, data.usesStock)
  )
  const [dashboards, setDashboards] = useState<TenantDashboardListItem[]>([])
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(
    data.activeDashboardId ?? null
  )
  const [dashboardName, setDashboardName] = useState(
    data.activeDashboardName ?? t('app.dashboard.picker.defaultName')
  )
  const [visibility, setVisibility] = useState<DashboardVisibility>(
    data.activeDashboardVisibility ?? 'private'
  )
  const [isDashboardOwner, setIsDashboardOwner] = useState(true)
  const [libraryLoading, setLibraryLoading] = useState(true)
  const [studioOpen, setStudioOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const refreshLibrary = useCallback(async () => {
    const supabase = createClient()
    return listTenantDashboards(supabase, data.orgId, data.userId)
  }, [data.orgId, data.userId])

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLibraryLoading(true)
      const supabase = createClient()
      try {
        const result = await ensureDefaultTenantDashboard(supabase, {
          organizationId: data.orgId,
          userId: data.userId,
          usesStock: data.usesStock,
          fallbackLayout: normalizeLayout(data.layout, data.usesStock),
          defaultName: t('app.dashboard.picker.defaultName'),
        })
        if (cancelled) return

        setDashboards(result.dashboards)
        setActiveDashboardId(result.activeId)
        setLayout(result.layout)

        const activeMeta = result.dashboards.find((d) => d.id === result.activeId)
        if (activeMeta) {
          setDashboardName(activeMeta.name)
          setVisibility(activeMeta.visibility)
          setIsDashboardOwner(activeMeta.is_mine)
        }

        const key = storageKey(data.orgId, data.userId)
        localStorage.setItem(key, JSON.stringify(result.layout))
      } catch (e) {
        console.warn('[dashboard] init library', e)
      } finally {
        if (!cancelled) setLibraryLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [data.orgId, data.userId, data.usesStock, data.layout, t])

  const persistLayout = useCallback(
    async (next: DashboardLayoutV2, meta?: { name: string; visibility: DashboardVisibility }) => {
      setSaving(true)
      const key = storageKey(data.orgId, data.userId)
      localStorage.setItem(key, JSON.stringify(next))

      const supabase = createClient()
      try {
        if (activeDashboardId && isDashboardOwner) {
          await updateTenantDashboard(supabase, {
            dashboardId: activeDashboardId,
            organizationId: data.orgId,
            userId: data.userId,
            name: meta?.name ?? dashboardName,
            layout: next,
            visibility: meta?.visibility ?? visibility,
            usesStock: data.usesStock,
          })
        } else {
          await supabase
            .from('organization_members')
            .update({ dashboard_layout: next })
            .eq('organization_id', data.orgId)
            .eq('user_id', data.userId)
        }
        const list = await refreshLibrary()
        setDashboards(list)
      } catch (e) {
        console.warn('[dashboard] save', e)
        toast.error(t('app.dashboard.saveError'))
        setSaving(false)
        return false
      }
      setSaving(false)
      return true
    },
    [
      activeDashboardId,
      isDashboardOwner,
      dashboardName,
      visibility,
      data.orgId,
      data.userId,
      data.usesStock,
      refreshLibrary,
      toast,
      t,
    ]
  )

  async function handleSelectDashboard(id: string) {
    if (id === activeDashboardId) return
    setLibraryLoading(true)
    const supabase = createClient()
    try {
      const next = await activateTenantDashboard(supabase, {
        dashboardId: id,
        organizationId: data.orgId,
        userId: data.userId,
        usesStock: data.usesStock,
      })
      if (!next) return
      setLayout(next)
      setActiveDashboardId(id)
      const meta = dashboards.find((d) => d.id === id)
      if (meta) {
        setDashboardName(meta.name)
        setVisibility(meta.visibility)
        setIsDashboardOwner(meta.is_mine)
      }
      localStorage.setItem(storageKey(data.orgId, data.userId), JSON.stringify(next))
      toast.success(t('app.dashboard.picker.switched', { name: meta?.name ?? '' }))
    } catch {
      toast.error(t('app.dashboard.saveError'))
    } finally {
      setLibraryLoading(false)
    }
  }

  async function handleCreateDashboard() {
    setLibraryLoading(true)
    const supabase = createClient()
    try {
      const created = await createTenantDashboard(supabase, {
        organizationId: data.orgId,
        userId: data.userId,
        name: t('app.dashboard.picker.newDefaultName'),
        layout: createDefaultLayout(data.usesStock),
        visibility: 'private',
        usesStock: data.usesStock,
      })
      setLayout(created.layout)
      setActiveDashboardId(created.id)
      setDashboardName(created.name)
      setVisibility('private')
      setIsDashboardOwner(true)
      const list = await refreshLibrary()
      setDashboards(list)
      toast.success(t('app.dashboard.picker.created'))
    } catch {
      toast.error(t('app.dashboard.saveError'))
    } finally {
      setLibraryLoading(false)
    }
  }

  async function handleSaveStudio() {
    if (!isDashboardOwner) {
      setSaving(true)
      const supabase = createClient()
      try {
        const created = await createTenantDashboard(supabase, {
          organizationId: data.orgId,
          userId: data.userId,
          name: t('app.dashboard.picker.copyOf', { name: dashboardName }),
          layout,
          visibility: 'private',
          usesStock: data.usesStock,
        })
        setLayout(created.layout)
        setActiveDashboardId(created.id)
        setDashboardName(created.name)
        setVisibility('private')
        setIsDashboardOwner(true)
        setDashboards(await refreshLibrary())
        setStudioOpen(false)
        toast.success(t('app.dashboard.picker.savedAsCopy'))
      } catch {
        toast.error(t('app.dashboard.saveError'))
      } finally {
        setSaving(false)
      }
      return
    }

    const ok = await persistLayout(layout, { name: dashboardName, visibility })
    if (!ok) return
    setStudioOpen(false)
    toast.success(t('app.dashboard.layoutSaved'))
  }

  function handleReset() {
    setLayout(createDefaultLayout(data.usesStock))
  }

  return (
    <>
      <AppHeader
        title={t('app.hoy.title')}
        subtitle={`${data.orgName} · ${data.dateLabel} · ${data.periodLabel}`}
        onCustomize={() => setStudioOpen(true)}
        actionsBeforeMenu={
          <DashboardPicker
            dashboards={dashboards}
            activeId={activeDashboardId}
            loading={libraryLoading}
            onSelect={handleSelectDashboard}
            onCreateNew={handleCreateDashboard}
          />
        }
      />
      <AppMain className="space-y-4">
        <Suspense fallback={null}>
          <DateRangeFilter />
        </Suspense>
        <HoyDashboard data={data} layout={layout} useSavedLayout />
      </AppMain>

      <DashboardStudio
        open={studioOpen}
        layout={layout}
        data={data}
        usesStock={data.usesStock}
        dashboardName={dashboardName}
        onDashboardNameChange={setDashboardName}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        canEditSharing={isDashboardOwner}
        exportName={dashboardName}
        onExportNameChange={setDashboardName}
        onClose={() => setStudioOpen(false)}
        onChange={setLayout}
        onReset={handleReset}
        onSave={handleSaveStudio}
        saving={saving}
      />
    </>
  )
}
