'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

export interface TenantPickerOrg {
  id: string
  name: string
}

export function TenantPickerModal({
  open,
  orgs,
  activeOrgId,
  title,
  description,
  confirmLabel = 'Entrar',
  cancelLabel,
  loading,
  onPick,
  onCancel,
}: {
  open: boolean
  orgs: TenantPickerOrg[]
  activeOrgId?: string | null
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onPick: (orgId: string) => void
  onCancel?: () => void
}) {
  const [selected, setSelected] = useState<string>(activeOrgId ?? orgs[0]?.id ?? '')
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected(activeOrgId ?? orgs[0]?.id ?? '')
  }, [open, activeOrgId, orgs])

  useEffect(() => {
    if (!open) return

    dialogRef.current?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) onCancel()
      if (e.key === 'Enter' && selected && !loading) onPick(selected)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onCancel, onPick, selected, loading])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      {onCancel ? (
        <button
          type="button"
          className="bg-scrim absolute inset-0"
          aria-label="Cerrar"
          onClick={onCancel}
        />
      ) : (
        <div className="bg-scrim absolute inset-0" />
      )}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl outline-none"
      >
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] text-muted">{description}</p>

        <div className="mt-5 space-y-2">
          {orgs.map((o) => {
            const isSelected = o.id === selected
            const isActive = o.id === activeOrgId
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.id)}
                className={[
                  'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                  isSelected
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border hover:border-accent/30 hover:bg-surface-raised',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-foreground">{o.name}</p>
                  {isActive && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                      Activo
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{o.id}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex gap-2">
          {onCancel && cancelLabel && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            className="flex-1"
            loading={loading}
            disabled={!selected || selected === activeOrgId}
            onClick={() => onPick(selected)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
