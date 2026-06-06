'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export type AppDialogTone = 'warning' | 'danger' | 'info'

export type AppDialogConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: AppDialogTone
}

export type AppDialogAlertOptions = {
  title?: string
  message: string
  confirmText?: string
  tone?: AppDialogTone
}

type AppDialogContextValue = {
  confirm: (options: AppDialogConfirmOptions | string) => Promise<boolean>
  alert: (options: AppDialogAlertOptions | string) => Promise<void>
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null)

type DialogState = {
  kind: 'confirm' | 'alert'
  title: string
  message: string
  confirmText: string
  cancelText: string
  tone: AppDialogTone
  resolve: (value: boolean) => void
}

function normalizeConfirmOptions(options: AppDialogConfirmOptions | string): AppDialogConfirmOptions {
  return typeof options === 'string' ? { message: options } : options
}

function normalizeAlertOptions(options: AppDialogAlertOptions | string): AppDialogAlertOptions {
  return typeof options === 'string' ? { message: options } : options
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const confirm = useCallback((options: AppDialogConfirmOptions | string) => {
    const opts = normalizeConfirmOptions(options)
    return new Promise<boolean>((resolve) => {
      setDialog({
        kind: 'confirm',
        title: opts.title ?? 'Confirmar',
        message: opts.message,
        confirmText: opts.confirmText ?? 'Confirmar',
        cancelText: opts.cancelText ?? 'Cancelar',
        tone: opts.tone ?? 'warning',
        resolve,
      })
    })
  }, [])

  const alert = useCallback((options: AppDialogAlertOptions | string) => {
    const opts = normalizeAlertOptions(options)
    return new Promise<void>((resolve) => {
      setDialog({
        kind: 'alert',
        title: opts.title ?? 'Aviso',
        message: opts.message,
        confirmText: opts.confirmText ?? 'Entendido',
        cancelText: '',
        tone: opts.tone ?? 'info',
        resolve: () => resolve(),
      })
    })
  }, [])

  function close(confirmed: boolean) {
    dialog?.resolve(confirmed)
    setDialog(null)
  }

  function handleCancel() {
    if (dialog?.kind === 'alert') close(true)
    else close(false)
  }

  return (
    <AppDialogContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmModal
        open={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        tone={dialog?.tone ?? 'warning'}
        variant={dialog?.kind === 'alert' ? 'alert' : 'confirm'}
        onConfirm={() => close(true)}
        onCancel={handleCancel}
      />
    </AppDialogContext.Provider>
  )
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext)
  if (!ctx) {
    throw new Error('useAppDialog debe usarse dentro de AppDialogProvider')
  }
  return ctx
}
