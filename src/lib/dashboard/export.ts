import { BRAND_NAME } from '@/lib/brand'
import { mergeDashboardLayout } from '@/lib/dashboard/defaults'
import { layoutV2ToV1, normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { DashboardLayout, DashboardLayoutV2, DashboardWidgetId } from '@/lib/dashboard/types'

const WIDGET_IDS: DashboardWidgetId[] = [
  'greeting',
  'ai_assistant',
  'kpis',
  'priorities',
  'quick_actions',
  'pipeline',
  'recent_leads',
  'low_stock',
]

export interface DashboardExportPack {
  formatVersion: 1
  layoutVersion: 2
  name: string
  description?: string
  exportedAt: string
  sections: DashboardLayoutV2['sections']
  widgets?: { id: DashboardWidgetId; enabled: boolean }[]
}

export interface DashboardExportBundle {
  velumDashboard: DashboardExportPack
  /** @deprecated Imports legacy */
  orbitDashboard?: DashboardExportPack
}

export function buildExportBundle(
  layout: DashboardLayout | DashboardLayoutV2,
  name: string,
  description?: string,
  usesStock = true
): DashboardExportBundle {
  const v2 = layout.version === 2 ? layout : normalizeLayout(layout, usesStock)
  const v1 = layoutV2ToV1(v2)

  const pack: DashboardExportPack = {
    formatVersion: 1,
    layoutVersion: 2,
    name: name.trim() || `${BRAND_NAME} dashboard`,
    description: description?.trim() || undefined,
    exportedAt: new Date().toISOString(),
    sections: v2.sections,
    widgets: v1.widgets.map(({ id, enabled }) => ({ id, enabled })),
  }

  return { velumDashboard: pack }
}

export function downloadExportBundle(bundle: DashboardExportBundle) {
  const slug = bundle.velumDashboard.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `velum-dashboard-${slug || 'export'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export type ParseImportResult =
  | { ok: true; layout: DashboardLayoutV2; name: string; description?: string }
  | { ok: false; error: string }

function extractPack(root: Record<string, unknown>): Record<string, unknown> | null {
  if (root.velumDashboard && typeof root.velumDashboard === 'object') {
    return root.velumDashboard as Record<string, unknown>
  }
  if (root.orbitDashboard && typeof root.orbitDashboard === 'object') {
    return root.orbitDashboard as Record<string, unknown>
  }
  if (Array.isArray(root.widgets) || Array.isArray(root.sections)) {
    return root
  }
  return null
}

export function parseImportBundle(raw: unknown, usesStock: boolean): ParseImportResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'invalid_json' }
  }

  const root = raw as Record<string, unknown>
  const pack = extractPack(root)

  if (!pack) return { ok: false, error: 'missing_velum_dashboard' }

  if (Array.isArray(pack.sections)) {
    const layout = mergeDashboardLayout(
      { version: 2, sections: pack.sections },
      usesStock
    )
    return {
      ok: true,
      layout,
      name: typeof pack.name === 'string' ? pack.name : 'Dashboard importado',
      description: typeof pack.description === 'string' ? pack.description : undefined,
    }
  }

  const widgets = pack.widgets
  if (!Array.isArray(widgets)) return { ok: false, error: 'missing_widgets' }

  const validWidgets = widgets
    .filter(
      (w): w is { id: DashboardWidgetId; enabled: boolean } =>
        typeof w === 'object' &&
        w !== null &&
        typeof (w as { id?: string }).id === 'string' &&
        WIDGET_IDS.includes((w as { id: string }).id as DashboardWidgetId) &&
        typeof (w as { enabled?: boolean }).enabled === 'boolean'
    )
    .map((w) => ({ id: w.id, enabled: w.enabled }))

  if (validWidgets.length === 0) return { ok: false, error: 'no_valid_widgets' }

  const layout = mergeDashboardLayout({ version: 1, widgets: validWidgets }, usesStock)

  return {
    ok: true,
    layout,
    name: typeof pack.name === 'string' ? pack.name : 'Dashboard importado',
    description: typeof pack.description === 'string' ? pack.description : undefined,
  }
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
