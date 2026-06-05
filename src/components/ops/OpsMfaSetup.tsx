'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'

interface OpsMfaSetupProps {
  hasVerifiedFactor: boolean
  sessionAal2: boolean
}

export function OpsMfaSetup({ hasVerifiedFactor, sessionAal2 }: OpsMfaSetupProps) {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [factorId, setFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function startEnroll() {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'orBit Ops',
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setFactorId(data.id)
    setQr(data.totp.qr_code)
    setSecret(data.totp.secret)
  }

  async function verifyEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setLoading(true)
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
    if (chErr) {
      setLoading(false)
      toast.error(chErr.message)
      return
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('MFA activado')
    router.refresh()
    router.push('/ops')
  }

  async function verifySession(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totp = factors?.totp?.find((f) => f.status === 'verified')
    if (!totp) {
      setLoading(false)
      toast.error('No hay factor TOTP configurado.')
      return
    }
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: totp.id,
    })
    if (chErr) {
      setLoading(false)
      toast.error(chErr.message)
      return
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge.id,
      code: code.trim(),
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Sesión verificada')
    router.refresh()
    router.push('/ops')
  }

  if (hasVerifiedFactor && !sessionAal2) {
    return (
      <form onSubmit={(e) => void verifySession(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <p className="text-[13px] text-muted">Ingresá el código de tu autenticador para continuar.</p>
        <Input
          label="Código de 6 dígitos"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" loading={loading}>
          Verificar
        </Button>
      </form>
    )
  }

  if (!qr) {
    return (
      <Button type="button" className="w-full" loading={loading} onClick={() => void startEnroll()}>
        Configurar autenticador
      </Button>
    )
  }

  return (
    <form onSubmit={(e) => void verifyEnroll(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      {qr.startsWith('data:') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR MFA" className="mx-auto h-48 w-48 rounded-lg bg-white p-2" />
      ) : (
        <p className="text-[12px] break-all text-muted">{qr}</p>
      )}
      {secret && (
        <p className="text-[12px] text-muted">
          Clave manual: <code className="text-foreground">{secret}</code>
        </p>
      )}
      <Input
        label="Código de 6 dígitos"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
      <Button type="submit" className="w-full" loading={loading}>
        Activar MFA
      </Button>
    </form>
  )
}
