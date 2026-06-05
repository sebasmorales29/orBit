import { createDefaultLayoutV2, normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { DashboardLayoutV2 } from '@/lib/dashboard/types'

export { DASHBOARD_WIDGET_META, dashId, createDefaultLayoutV2 } from '@/lib/dashboard/widget-meta'
export { normalizeLayout } from '@/lib/dashboard/layout-v2'

export function createDefaultLayout(usesStock: boolean): DashboardLayoutV2 {
  return createDefaultLayoutV2(usesStock)
}

export function mergeDashboardLayout(saved: unknown, usesStock: boolean): DashboardLayoutV2 {
  return normalizeLayout(saved, usesStock)
}

export function storageKey(orgId: string, userId: string) {
  return `orbit-dashboard-v2:${orgId}:${userId}`
}
