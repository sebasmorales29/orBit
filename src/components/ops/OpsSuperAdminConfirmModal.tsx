'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { opsPreverifySuperAdminEmailConfirm } from '@/lib/platform/actions'

interface OpsSuperAdminConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText: string
  tone?: 'warning' | 'danger'
  loading?: boolean
  onCancel: () => void
  /** Pide al servidor enviar código al correo y retorna challengeId */
  onRequestEmailCode: () => Promise<string>
  /** Purpose del challenge para verificación previa del correo */
  emailPurpose: Parameters<typeof opsPreverifySuperAdminEmailConfirm>[0]['purpose']
  /** Se llama cuando ambos códigos fueron validados */
  onConfirmed: (input: { emailChallengeId: string; emailCode: string }) => void | Promise<void>
}

export function OpsSuperAdminConfirmModal({
  open,
  title,
  message,
  confirmText,
  tone = 'warning',
  loading,
  onCancel,
  onRequestEmailCode,
  emailPurpose,
  onConfirmed,
}: OpsSuperAdminConfirmModalProps) {
  const supabase = createClient()
  const [mfaCode, setMfaCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [mfaVerified, setMfaVerified] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const mfaOnceRef = useRef(false)
  const emailOnceRef = useRef(false)
  const busy = Boolean(loading) || sending || verifying

  const border = tone === 'danger' ? 'border-red-500/40' : 'border-amber-500/45'
  const bg = tone === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
  const titleColor =
    tone === 'danger'
      ? 'text-red-700 dark:text-red-300'
      : 'text-amber-800 dark:text-amber-300'

  const canSubmit = useMemo(() => {
    return mfaVerified && emailVerified && !!challengeId
  }, [mfaVerified, emailVerified, challengeId])

  useEffect(() => {
    // Reset al abrir/cerrar.
    if (!open) return
    setMfaVerified(false)
    setMfaError(null)
    setChallengeId(null)
    setMfaCode('')
    setEmailCode('')
    setEmailVerified(false)
    setEmailError(null)
    mfaOnceRef.current = false
    emailOnceRef.current = false
  }, [open])

  useEffect(() => {
    // Verifica MFA automáticamente al completar 6 dígitos (una vez).
    const trimmed = mfaCode.trim()
    if (mfaVerified) return
    if (trimmed.length !== 6) return
    if (mfaOnceRef.current) return
    mfaOnceRef.current = true

    const run = async () => {
      setVerifying(true)
      setMfaError(null)

      const { data: factors, error: factorsErr } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find((f) => f.status === 'verified')
      if (factorsErr || !totp) {
        setVerifying(false)
        setMfaError('No hay MFA configurado para esta cuenta.')
        mfaOnceRef.current = false
        return
      }

      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: totp.id,
      })
      if (chErr) {
        setVerifying(false)
        setMfaError('No se pudo iniciar el desafío de MFA. Reintentá.')
        mfaOnceRef.current = false
        return
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code: trimmed,
      })
      if (verifyErr) {
        setVerifying(false)
        setMfaError('Código MFA incorrecto.')
        mfaOnceRef.current = false
        return
      }

      setVerifying(false)
      setMfaVerified(true)
      setMfaError(null)
    }

    void run()
  }, [mfaCode, mfaVerified, supabase])

  useEffect(() => {
    // Verifica el código por correo automáticamente al completar 6 dígitos (una vez).
    const trimmed = emailCode.trim()
    if (!challengeId) return
    if (!mfaVerified) return
    if (emailVerified) return
    if (trimmed.length !== 6) return
    if (emailOnceRef.current) return
    emailOnceRef.current = true

    const run = async () => {
      setVerifying(true)
      setEmailError(null)
      const result = await opsPreverifySuperAdminEmailConfirm({
        challengeId,
        code: trimmed,
        purpose: emailPurpose,
      })
      setVerifying(false)
      if (!result.ok) {
        setEmailError(result.message)
        emailOnceRef.current = false
        return
      }
      setEmailVerified(true)
      setEmailError(null)
    }

    void run()
  }, [challengeId, emailCode, emailPurpose, emailVerified, mfaVerified])

  async function sendEmailCode() {
    setSending(true)
    try {
      const id = await onRequestEmailCode()
      setChallengeId(id)
      setEmailVerified(false)
      setEmailError(null)
      setEmailCode('')
      emailOnceRef.current = false
    } finally {
      setSending(false)
    }
  }

  async function verifyAll(e: React.FormEvent) {
    e.preventDefault()
    if (!challengeId) return
    if (!mfaVerified) return
    if (!emailVerified) return
    await onConfirmed({ emailChallengeId: challengeId, emailCode: emailCode.trim() })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={onCancel}
        disabled={busy}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-xl rounded-3xl border ${border} bg-surface p-5 shadow-2xl`}
      >
        <div className={`rounded-2xl border ${border} ${bg} p-4`}>
          <p className={`text-[13px] font-semibold ${titleColor}`}>{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{message}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">
            Confirmación doble requerida: MFA + correo.
          </p>
          <Button
            type="button"
            variant="secondary"
            loading={sending}
            disabled={busy || !mfaVerified}
            onClick={() => void sendEmailCode()}
          >
            {challengeId ? 'Reenviar código' : 'Enviar código al correo'}
          </Button>
        </div>

        <form onSubmit={(e) => void verifyAll(e)} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Código MFA (autenticador)"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="123456"
              required
              disabled={busy || mfaVerified}
              className={mfaVerified ? 'border-emerald-500/60 focus:border-emerald-500/70' : undefined}
              aria-invalid={Boolean(mfaError) || undefined}
            />
            <Input
              label="Código por correo"
              inputMode="numeric"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              placeholder="123456"
              required
              disabled={busy || !challengeId || emailVerified}
              className={emailVerified ? 'border-emerald-500/60 focus:border-emerald-500/70' : undefined}
              aria-invalid={Boolean(emailError) || undefined}
            />
          </div>
          {!mfaVerified ? (
            <p className="text-[12px] text-muted">
              Ingresá el código del autenticador. Al completar 6 dígitos lo verificamos al instante.
              {mfaError ? <span className="text-red-500"> {mfaError}</span> : null}
            </p>
          ) : (
            <p className="text-[12px] text-muted">
              MFA verificado. Pedí el código por correo y al completar 6 dígitos lo verificamos al instante.
              {emailError ? <span className="text-red-500"> {emailError}</span> : null}
              {emailVerified ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {' '}Código por correo verificado.
                </span>
              ) : null}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={busy}
              disabled={!canSubmit}
            >
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

