import type { DashboardWidgetId, DashboardWidgetMeta, GridSpan } from '@/lib/dashboard/types'

export function dashId(prefix = 'd'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`
}

export const DASHBOARD_WIDGET_META: DashboardWidgetMeta[] = [
  {
    id: 'greeting',
    labelKey: 'app.dashboard.widgets.greeting',
    descriptionKey: 'app.dashboard.widgets.greetingDesc',
    categoryKey: 'app.dashboard.categories.overview',
    locked: true,
    defaultSpan: 12,
  },
  {
    id: 'ai_assistant',
    labelKey: 'app.dashboard.widgets.aiAssistant',
    descriptionKey: 'app.dashboard.widgets.aiAssistantDesc',
    categoryKey: 'app.dashboard.categories.overview',
    defaultSpan: 12,
  },
  {
    id: 'kpis',
    labelKey: 'app.dashboard.widgets.kpis',
    descriptionKey: 'app.dashboard.widgets.kpisDesc',
    categoryKey: 'app.dashboard.categories.metrics',
    defaultSpan: 12,
  },
  {
    id: 'priorities',
    labelKey: 'app.dashboard.widgets.priorities',
    descriptionKey: 'app.dashboard.widgets.prioritiesDesc',
    categoryKey: 'app.dashboard.categories.operations',
    defaultSpan: 8,
  },
  {
    id: 'quick_actions',
    labelKey: 'app.dashboard.widgets.quickActions',
    descriptionKey: 'app.dashboard.widgets.quickActionsDesc',
    categoryKey: 'app.dashboard.categories.operations',
    defaultSpan: 4,
  },
  {
    id: 'pipeline',
    labelKey: 'app.dashboard.widgets.pipeline',
    descriptionKey: 'app.dashboard.widgets.pipelineDesc',
    categoryKey: 'app.dashboard.categories.pipeline',
    defaultSpan: 12,
  },
  {
    id: 'recent_leads',
    labelKey: 'app.dashboard.widgets.recentLeads',
    descriptionKey: 'app.dashboard.widgets.recentLeadsDesc',
    categoryKey: 'app.dashboard.categories.pipeline',
    defaultSpan: 12,
  },
  {
    id: 'low_stock',
    labelKey: 'app.dashboard.widgets.lowStock',
    descriptionKey: 'app.dashboard.widgets.lowStockDesc',
    categoryKey: 'app.dashboard.categories.inventory',
    requiresStock: true,
    defaultSpan: 12,
  },
]

export function metaSpan(id: DashboardWidgetId): GridSpan {
  return DASHBOARD_WIDGET_META.find((m) => m.id === id)?.defaultSpan ?? 12
}

function cell(widgetId: DashboardWidgetId, span: GridSpan, enabled: boolean) {
  return { id: dashId('cell'), widgetId, span, enabled }
}

function row(...cells: ReturnType<typeof cell>[]) {
  return { id: dashId('row'), cells }
}

function section(title: string, ...rows: ReturnType<typeof row>[]) {
  return { id: dashId('sec'), title, collapsed: false, rows }
}

export function createDefaultLayoutV2(usesStock: boolean) {
  const sections = [
    section(
      'Centro de mando',
      row(cell('greeting', 12, true)),
      row(cell('ai_assistant', 12, true))
    ),
    section('Métricas', row(cell('kpis', 12, true))),
    section(
      'Operación del día',
      row(cell('priorities', 8, true), cell('quick_actions', 4, true))
    ),
    section(
      'Embudo y consultas',
      row(cell('pipeline', 12, false)),
      row(cell('recent_leads', 12, false))
    ),
  ]

  if (usesStock) {
    sections.push(section('Inventario', row(cell('low_stock', 12, true))))
  }

  return { version: 2 as const, sections }
}
