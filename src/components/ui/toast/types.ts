export type ToastVariant = 'success' | 'error'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
  title?: string
  durationMs: number
}

export interface ToastInput {
  message: string
  title?: string
  durationMs?: number
}
