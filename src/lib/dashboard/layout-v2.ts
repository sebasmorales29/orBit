import { createDefaultLayoutV2, DASHBOARD_WIDGET_META, dashId, metaSpan } from '@/lib/dashboard/widget-meta'
import type {
  DashboardCell,
  DashboardLayout,
  DashboardLayoutV2,
  DashboardLayoutV1,
  DashboardRow,
  DashboardSection,
  DashboardWidgetId,
  GridSpan,
} from '@/lib/dashboard/types'

export { createDefaultLayoutV2, dashId } from '@/lib/dashboard/widget-meta'

export function isLayoutV2(layout: DashboardLayout): layout is DashboardLayoutV2 {
  return layout.version === 2 && Array.isArray((layout as DashboardLayoutV2).sections)
}

export function migrateV1ToV2(v1: DashboardLayoutV1, usesStock: boolean): DashboardLayoutV2 {
  const enabled = v1.widgets.filter((w) => w.enabled)
  if (enabled.length === 0) return createDefaultLayoutV2(usesStock)

  const rows: DashboardRow[] = enabled.map((w) => ({
    id: dashId('row'),
    cells: [
      {
        id: dashId('cell'),
        widgetId: w.id,
        span: metaSpan(w.id),
        enabled: true,
      },
    ],
  }))

  return {
    version: 2,
    sections: [
      {
        id: dashId('sec'),
        title: 'Principal',
        collapsed: false,
        rows,
      },
    ],
  }
}

export function normalizeLayout(layout: unknown, usesStock: boolean): DashboardLayoutV2 {
  if (!layout || typeof layout !== 'object') return createDefaultLayoutV2(usesStock)

  if (isLayoutV2(layout as DashboardLayout)) {
    return sanitizeLayoutV2(layout as DashboardLayoutV2, usesStock)
  }

  const v1 = layout as DashboardLayoutV1
  if (v1.version === 1 && Array.isArray(v1.widgets)) {
    return sanitizeLayoutV2(migrateV1ToV2(v1, usesStock), usesStock)
  }

  return createDefaultLayoutV2(usesStock)
}

const KNOWN_WIDGETS = new Set(DASHBOARD_WIDGET_META.map((m) => m.id))

export function sanitizeLayoutV2(layout: DashboardLayoutV2, usesStock: boolean): DashboardLayoutV2 {
  const sections: DashboardSection[] = []

  for (const sec of layout.sections ?? []) {
    const rows: DashboardRow[] = []
    for (const row of sec.rows ?? []) {
      const cells: DashboardCell[] = []
      for (const cell of row.cells ?? []) {
        if (!KNOWN_WIDGETS.has(cell.widgetId)) continue
        const meta = DASHBOARD_WIDGET_META.find((m) => m.id === cell.widgetId)
        if (meta?.requiresStock && !usesStock) continue
        cells.push({
          id: cell.id || dashId('cell'),
          widgetId: cell.widgetId,
          span: ([3, 4, 6, 8, 12] as GridSpan[]).includes(cell.span) ? cell.span : metaSpan(cell.widgetId),
          enabled: cell.widgetId === 'greeting' ? true : Boolean(cell.enabled),
        })
      }
      if (cells.length > 0) rows.push({ id: row.id || dashId('row'), cells })
    }
    if (rows.length > 0) {
      sections.push({
        id: sec.id || dashId('sec'),
        title: sec.title?.trim() || 'Sección',
        collapsed: Boolean(sec.collapsed),
        rows,
      })
    }
  }

  if (sections.length === 0) return createDefaultLayoutV2(usesStock)
  return { version: 2, sections }
}

export function getPlacedWidgetIds(layout: DashboardLayoutV2): Set<DashboardWidgetId> {
  const ids = new Set<DashboardWidgetId>()
  for (const sec of layout.sections) {
    for (const row of sec.rows) {
      for (const cell of row.cells) ids.add(cell.widgetId)
    }
  }
  return ids
}

export function flattenEnabledWidgets(layout: DashboardLayoutV2): DashboardWidgetId[] {
  const order: DashboardWidgetId[] = []
  for (const sec of layout.sections) {
    if (sec.collapsed) continue
    for (const row of sec.rows) {
      for (const cell of row.cells) {
        if (cell.enabled) order.push(cell.widgetId)
      }
    }
  }
  return order
}

export function layoutV2ToV1(layout: DashboardLayoutV2): DashboardLayoutV1 {
  const widgets: { id: DashboardWidgetId; enabled: boolean }[] = []
  const seen = new Set<DashboardWidgetId>()

  for (const sec of layout.sections) {
    for (const row of sec.rows) {
      for (const cell of row.cells) {
        if (seen.has(cell.widgetId)) continue
        seen.add(cell.widgetId)
        widgets.push({ id: cell.widgetId, enabled: cell.enabled })
      }
    }
  }

  for (const meta of DASHBOARD_WIDGET_META) {
    if (!seen.has(meta.id)) widgets.push({ id: meta.id, enabled: false })
  }

  return { version: 1, widgets }
}

export function addSection(layout: DashboardLayoutV2, title = 'Nueva sección'): DashboardLayoutV2 {
  return {
    ...layout,
    sections: [
      ...layout.sections,
      { id: dashId('sec'), title, collapsed: false, rows: [] },
    ],
  }
}

export function removeSection(layout: DashboardLayoutV2, sectionId: string): DashboardLayoutV2 {
  const next = layout.sections.filter((s) => s.id !== sectionId)
  if (next.length === 0) return layout
  return { ...layout, sections: next }
}

export function updateSection(
  layout: DashboardLayoutV2,
  sectionId: string,
  patch: Partial<Pick<DashboardSection, 'title' | 'collapsed'>>
): DashboardLayoutV2 {
  return {
    ...layout,
    sections: layout.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
  }
}

export function addRow(layout: DashboardLayoutV2, sectionId: string): DashboardLayoutV2 {
  return {
    ...layout,
    sections: layout.sections.map((s) =>
      s.id === sectionId
        ? { ...s, rows: [...s.rows, { id: dashId('row'), cells: [] }] }
        : s
    ),
  }
}

export function removeRow(layout: DashboardLayoutV2, sectionId: string, rowId: string): DashboardLayoutV2 {
  return {
    ...layout,
    sections: layout.sections.map((s) =>
      s.id === sectionId ? { ...s, rows: s.rows.filter((r) => r.id !== rowId) } : s
    ),
  }
}

export function addCell(
  layout: DashboardLayoutV2,
  sectionId: string,
  rowId: string,
  widgetId: DashboardWidgetId
): DashboardLayoutV2 | null {
  if (getPlacedWidgetIds(layout).has(widgetId)) return null
  const meta = DASHBOARD_WIDGET_META.find((m) => m.id === widgetId)
  const cell: DashboardCell = {
    id: dashId('cell'),
    widgetId,
    span: meta?.defaultSpan ?? 12,
    enabled: true,
  }
  return {
    ...layout,
    sections: layout.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            rows: s.rows.map((r) =>
              r.id === rowId ? { ...r, cells: [...r.cells, cell] } : r
            ),
          }
        : s
    ),
  }
}

export function removeCell(
  layout: DashboardLayoutV2,
  sectionId: string,
  rowId: string,
  cellId: string
): DashboardLayoutV2 {
  return {
    ...layout,
    sections: layout.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            rows: s.rows.map((r) =>
              r.id === rowId ? { ...r, cells: r.cells.filter((c) => c.id !== cellId) } : r
            ),
          }
        : s
    ),
  }
}

export function updateCell(
  layout: DashboardLayoutV2,
  sectionId: string,
  rowId: string,
  cellId: string,
  patch: Partial<Pick<DashboardCell, 'span' | 'enabled'>>
): DashboardLayoutV2 {
  return {
    ...layout,
    sections: layout.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            rows: s.rows.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    cells: r.cells.map((c) =>
                      c.id === cellId
                        ? {
                            ...c,
                            ...patch,
                            enabled: c.widgetId === 'greeting' ? true : (patch.enabled ?? c.enabled),
                          }
                        : c
                    ),
                  }
                : r
            ),
          }
        : s
    ),
  }
}

export function moveSection(layout: DashboardLayoutV2, sectionId: string, dir: -1 | 1): DashboardLayoutV2 {
  const idx = layout.sections.findIndex((s) => s.id === sectionId)
  const next = idx + dir
  if (idx < 0 || next < 0 || next >= layout.sections.length) return layout
  const sections = [...layout.sections]
  ;[sections[idx], sections[next]] = [sections[next], sections[idx]]
  return { ...layout, sections }
}

export function moveRow(
  layout: DashboardLayoutV2,
  sectionId: string,
  rowId: string,
  dir: -1 | 1
): DashboardLayoutV2 {
  return {
    ...layout,
    sections: layout.sections.map((s) => {
      if (s.id !== sectionId) return s
      const idx = s.rows.findIndex((r) => r.id === rowId)
      const next = idx + dir
      if (idx < 0 || next < 0 || next >= s.rows.length) return s
      const rows = [...s.rows]
      ;[rows[idx], rows[next]] = [rows[next], rows[idx]]
      return { ...s, rows }
    }),
  }
}

export type StudioSelection =
  | { kind: 'section'; sectionId: string }
  | { kind: 'row'; sectionId: string; rowId: string }
  | { kind: 'cell'; sectionId: string; rowId: string; cellId: string }
  | null
