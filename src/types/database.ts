export type LeadStatus =
  | 'nuevo'
  | 'interesado'
  | 'cotizado'
  | 'por_cerrar'
  | 'ganado'
  | 'perdido'

export type OrderStatus =
  | 'confirmado'
  | 'en_preparacion'
  | 'entregado'
  | 'cobrado'
  | 'cancelado'

export type CurrencyCode = 'CRC' | 'USD'

export type TenantRole = 'owner' | 'administrator' | 'member' | 'visitor'

export interface Organization {
  id: string
  name: string
  business_type: string | null
  currency: CurrencyCode
  uses_stock: boolean
  onboarding_completed: boolean
  onboarding_profile?: Record<string, unknown> | null
  subscription_owner_id?: string | null
  provisioned_source?: 'self_service' | 'ops' | null
  selected_plan?: string | null
  brand_theme?: Record<string, unknown> | null
  platform_status?: string | null
  plan_tier?: string | null
  subscription_status?: 'pending_payment' | 'active' | 'past_due' | 'canceled' | null
  billing_cycle?: string | null
}

export interface Lead {
  id: string
  organization_id: string
  name: string
  phone: string | null
  product_interest: string | null
  estimated_amount: number | null
  status: LeadStatus
  score: number
  notes: string | null
  last_contact_at: string
  created_at: string
}

export interface Order {
  id: string
  organization_id: string
  customer_id: string | null
  lead_id: string | null
  sale_number?: number | null
  buyer_name?: string | null
  buyer_phone?: string | null
  subtotal?: number | null
  tax_amount?: number | null
  payment_method?: string | null
  shipping_address?: Record<string, unknown> | null
  status: OrderStatus
  total: number
  paid: boolean
  delivered_at: string | null
  notes: string | null
  external_id?: string | null
  external_source?: string | null
  source_metadata?: Record<string, unknown>
  created_at: string
}

export interface Product {
  id: string
  organization_id: string
  name: string
  sku: string | null
  stock: number
  stock_minimum: number
  price: number
  unit_cost?: number
}

export interface Task {
  id: string
  organization_id: string
  type: string
  title: string
  description: string | null
  due_at: string | null
  completed: boolean
  lead_id: string | null
  order_id: string | null
  priority: number
}

export interface TodayAction {
  id: string
  type: 'follow_up' | 'prepare_order' | 'collect_payment' | 'restock' | 'task'
  title: string
  subtitle: string
  urgency: 'high' | 'medium' | 'low'
  amount?: number
  href?: string
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  interesado: 'Interesado',
  cotizado: 'Cotizado',
  por_cerrar: 'Por cerrar',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

/** Etiquetas en UI para consultas (antes “leads”). */
export const INQUIRY_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nueva',
  interesado: 'En conversación',
  cotizado: 'Cotizada',
  por_cerrar: 'Por cerrar',
  ganado: 'Convertida en venta',
  perdido: 'Archivada',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
  cobrado: 'Cobrado',
  cancelado: 'Cancelado',
}

export function formatMoney(amount: number, currency: CurrencyCode = 'CRC'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
