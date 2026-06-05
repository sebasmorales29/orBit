import type { LeadStatus, OrderStatus } from '@/types/database'

export const LEAD_STATUS_CLASS: Record<LeadStatus, string> = {
  nuevo: 'bg-accent/15 text-accent',
  interesado: 'bg-surface-hover text-foreground',
  cotizado: 'bg-accent/10 text-accent',
  por_cerrar: 'bg-accent/20 text-accent',
  ganado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  perdido: 'bg-surface-hover text-muted',
}

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  confirmado: 'bg-accent/15 text-accent',
  en_preparacion: 'bg-surface-hover text-foreground',
  entregado: 'bg-accent/10 text-accent',
  cobrado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cancelado: 'bg-surface-hover text-muted',
}
