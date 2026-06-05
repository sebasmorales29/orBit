import { Button } from '@/components/ui/Button'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'warning' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  tone = 'warning',
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const border =
    tone === 'danger' ? 'border-red-500/40' : 'border-amber-500/45'
  const bg = tone === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
  const titleColor =
    tone === 'danger'
      ? 'text-red-700 dark:text-red-300'
      : 'text-amber-800 dark:text-amber-300'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-md rounded-3xl border ${border} bg-surface p-5 shadow-2xl`}
      >
        <div className={`rounded-2xl border ${border} ${bg} p-4`}>
          <p className={`text-[13px] font-semibold ${titleColor}`}>{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{message}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

