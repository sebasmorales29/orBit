'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface OpsMfaConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText: string
  tone?: 'warning' | 'danger'
  loading?: boolean
  onCancel: () => void
  /** Se llama después de elevar la sesión a AAL2 */
  onConfirmed: () => void | Promise<void>
}

export function OpsMfaConfirmModal({
  open,
  title,
  message,
  confirmText,
  tone = 'warning',
  loading,
  onCancel,
  onConfirmed,
}: OpsMfaConfirmModalProps) {
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const busy = Boolean(loading) || verifying

  if (!open) return null

  const border = tone === 'danger' ? 'border-red-500/40' : 'border-amber-500/45'
  const bg = tone === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
  const titleColor =
    tone === 'danger'
      ? 'text-red-700 dark:text-red-300'
      : 'text-amber-800 dark:text-amber-300'

  async function verifyNow(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)

    const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
    const totp = factors?.totp?.find((f) => f.status === 'verified')
    if (factorsErr || !totp) {
      setVerifying(false)
      return
    }

    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: totp.id,
    })
    if (chErr) {
      setVerifying(false)
      return
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge.id,
      code: code.trim(),
    })

    if (verifyErr) {
      setVerifying(false)
      return
    }

    setVerifying(false)
    await onConfirmed()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="bg-scrim absolute inset-0"
        aria-label="Cerrar"
        onClick={onCancel}
        disabled={busy}
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

        <form onSubmit={(e) => void verifyNow(e)} className="mt-4 space-y-3">
          <Input
            label="Código actual del autenticador"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={busy}
            >
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

