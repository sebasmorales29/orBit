'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { OpsAdminRow } from '@/lib/platform/ops-access'
import { Button } from '@/components/ui/Button'

export function OpsAccessAdminDetailModal({
  admin,
  onClose,
}: {
  admin: OpsAdminRow | null
  onClose: () => void
}) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!admin) return

    closeBtnRef.current?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [admin, onClose])

  if (!admin) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-foreground">Detalle del operador</h2>
        <p className="mt-1 text-[13px] text-muted">{admin.email}</p>

        <dl className="mt-5 space-y-3 text-[13px]">
          <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
            <dt className="text-muted">Rol</dt>
            <dd className="font-medium text-foreground">
              {admin.is_super ? 'Super admin' : 'Operador delegado'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
            <dt className="text-muted">MFA</dt>
            <dd
              className={
                admin.mfa_enrolled
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : 'font-medium text-muted'
              }
            >
              {admin.mfa_enrolled ? 'Activo' : 'Sin configurar'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
            <dt className="text-muted">Política MFA</dt>
            <dd className="font-medium text-foreground">
              {admin.is_super
                ? 'Siempre obligatorio'
                : admin.mfa_required
                  ? 'Obligatorio'
                  : 'Opcional'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
            <dt className="text-muted">User ID</dt>
            <dd className="max-w-[200px] truncate font-mono text-[11px] text-foreground">
              {admin.user_id ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Alta en /ops</dt>
            <dd className="font-medium text-foreground">
              {new Date(admin.created_at).toLocaleString('es-CR')}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {admin.user_id && (
            <Link
              href={`/ops/users/${admin.user_id}`}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-4 py-2.5 text-[13px] font-medium hover:bg-surface-raised"
            >
              Ver en Usuarios
            </Link>
          )}
          <Button
            ref={closeBtnRef}
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
