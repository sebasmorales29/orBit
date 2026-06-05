'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

export function InviteLoginForm({ email, token }: { email: string; token: string }) {
  const router = useRouter()
  const toast = useToast()
  const [typedEmail, setTypedEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailOk, setEmailOk] = useState(false)
  const [passwordOk, setPasswordOk] = useState(false)
  const verifyOnceRef = useRef(false)
  const lastAttemptRef = useRef<string>('')

  useEffect(() => {
    setTypedEmail(email)
  }, [email])

  useEffect(() => {
    const ok = typedEmail.trim().toLowerCase() === email.trim().toLowerCase()
    setEmailOk(ok)
    if (!ok) {
      setPasswordOk(false)
      verifyOnceRef.current = false
      lastAttemptRef.current = ''
    }
  }, [typedEmail, email])

  const emailBorder = useMemo(() => {
    if (!typedEmail.trim()) return 'border-border'
    return emailOk ? 'border-emerald-500/70 ring-2 ring-emerald-500/15' : 'border-red-500/60'
  }, [typedEmail, emailOk])

  const passBorder = useMemo(() => {
    if (!password.trim()) return 'border-border'
    return passwordOk ? 'border-emerald-500/70 ring-2 ring-emerald-500/15' : 'border-border'
  }, [password, passwordOk])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!emailOk) {
      toast.error('El email no coincide con la invitación.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: typedEmail.trim(), password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    const { data } = await supabase.auth.getUser()
    const mustChange = Boolean(
      (data.user?.user_metadata as Record<string, unknown> | undefined)?.must_change_password
    )
    setPasswordOk(true)
    if (mustChange) {
      router.push(`/change-password?next=${encodeURIComponent(`/invite/${token}`)}`)
    } else {
      router.push(`/invite/${token}`)
    }
    router.refresh()
  }

  // Verificación “en vivo” de la contraseña temporal: cuando el email coincide y hay contraseña,
  // intentamos autenticar (una vez por valor) y si es correcta, ponemos verde y redirigimos.
  useEffect(() => {
    if (!emailOk) return
    const pass = password
    if (!pass || pass.trim().length < 6) return
    if (loading) return
    if (passwordOk) return

    const attemptKey = `${typedEmail.trim().toLowerCase()}::${pass}`
    if (attemptKey === lastAttemptRef.current) return

    const t = setTimeout(() => {
      if (verifyOnceRef.current && attemptKey === lastAttemptRef.current) return
      lastAttemptRef.current = attemptKey

      setLoading(true)
      const supabase = createClient()
      supabase.auth
        .signInWithPassword({ email: typedEmail.trim(), password: pass })
        .then(async ({ error }) => {
          setLoading(false)
          if (error) {
            // no pintamos rojo el password para evitar “falso negativo” con rate limit;
            // el usuario verá el error al presionar Entrar si insiste.
            return
          }

          const { data } = await supabase.auth.getUser()
          const mustChange = Boolean(
            (data.user?.user_metadata as Record<string, unknown> | undefined)?.must_change_password
          )
          setPasswordOk(true)
          verifyOnceRef.current = true

          if (mustChange) {
            router.push(`/change-password?next=${encodeURIComponent(`/invite/${token}`)}`)
          } else {
            router.push(`/invite/${token}`)
          }
          router.refresh()
        })
        .catch(() => setLoading(false))
    }, 450)

    return () => clearTimeout(t)
  }, [emailOk, password, typedEmail, token, router, loading, passwordOk])

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
      <div className="space-y-1">
        <label className="text-[12px] font-medium text-muted-foreground">Usuario</label>
        <input
          type="email"
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          className={`w-full rounded-xl border bg-surface-raised px-4 py-3 text-[14px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent/60 focus:ring-2 focus:ring-accent/15 ${emailBorder}`}
          placeholder="tu@correo.com"
          autoComplete="email"
          required
          disabled={passwordOk}
        />
      </div>
      <div className="space-y-1">
        <label className="text-[12px] font-medium text-muted-foreground">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full rounded-xl border bg-surface-raised px-4 py-3 text-[14px] text-foreground outline-none transition-[border-color,box-shadow] focus:border-accent/60 focus:ring-2 focus:ring-accent/15 ${passBorder}`}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={passwordOk}
        />
      </div>
      <p className="text-[12px] text-muted">
        Si es tu primera vez, usá la <span className="text-foreground">contraseña temporal</span> del correo. Al entrar,
        orBit te pedirá cambiarla.
      </p>
      <Button type="submit" className="w-full py-3" loading={loading}>
        Entrar
      </Button>
    </form>
  )
}

