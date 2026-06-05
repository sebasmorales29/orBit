'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import type { ToastInput, ToastItem, ToastVariant } from '@/components/ui/toast/types'
import { cn } from '@/lib/utils'

const MAX_TOASTS = 4
const DEFAULT_DURATION = 4200

type ToastApi = {
  success: (message: string, options?: Omit<ToastInput, 'message'>) => string
  error: (message: string, options?: Omit<ToastInput, 'message'>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function nextId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslations()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (variant: ToastVariant, message: string, options?: Omit<ToastInput, 'message'>) => {
      const id = nextId()
      const durationMs = options?.durationMs ?? DEFAULT_DURATION
      const title =
        options?.title ??
        (variant === 'success' ? t('toast.successTitle') : t('toast.errorTitle'))

      const item: ToastItem = { id, variant, message, title, durationMs }

      setToasts((prev) => [item, ...prev].slice(0, MAX_TOASTS))

      const timer = setTimeout(() => dismiss(id), durationMs)
      timersRef.current.set(id, timer)

      return id
    },
    [dismiss, t]
  )

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      dismiss,
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-end gap-2.5 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pr-[max(1rem,env(safe-area-inset-right))]"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const { t } = useTranslations()
  const isSuccess = toast.variant === 'success'
  const Icon = isSuccess ? CheckCircle2 : AlertCircle

  return (
    <div
      role="status"
      className={cn(
        'toast-enter pointer-events-auto flex w-[min(100%,22rem)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_8px_32px_rgb(0_0_0/0.12)] backdrop-blur-xl sm:w-[22rem]',
        'dark:shadow-[0_12px_40px_rgb(0_0_0/0.45)]',
        isSuccess
          ? 'border-emerald-500/35 bg-white/95 dark:bg-[#141414]/95'
          : 'border-red-500/35 bg-white/95 dark:bg-[#141414]/95'
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0',
          isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pr-1">
        <p
          className={cn(
            'text-[13px] font-semibold leading-snug',
            isSuccess ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'
          )}
        >
          {toast.title}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-foreground">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        aria-label={t('toast.dismiss')}
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}
