export type DashboardWidgetId =
  | 'greeting'
  | 'ai_assistant'
  | 'kpis'
  | 'priorities'
  | 'quick_actions'
  | 'pipeline'
  | 'recent_leads'
  | 'low_stock'

export type GridSpan = 3 | 4 | 6 | 8 | 12

export interface DashboardWidgetConfig {
  id: DashboardWidgetId
  enabled: boolean
}

/** @deprecated Layout plano v1 — se migra automáticamente a v2 */
export interface DashboardLayoutV1 {
  version: 1
  widgets: DashboardWidgetConfig[]
}

export interface DashboardCell {
  id: string
  widgetId: DashboardWidgetId
  span: GridSpan
  enabled: boolean
}

export interface DashboardRow {
  id: string
  cells: DashboardCell[]
}

export interface DashboardSection {
  id: string
  title: string
  collapsed: boolean
  rows: DashboardRow[]
}

export interface DashboardLayoutV2 {
  version: 2
  sections: DashboardSection[]
}

export type DashboardLayout = DashboardLayoutV1 | DashboardLayoutV2

export interface DashboardWidgetMeta {
  id: DashboardWidgetId
  labelKey: string
  descriptionKey: string
  categoryKey: string
  requiresStock?: boolean
  locked?: boolean
  defaultSpan?: GridSpan
}
