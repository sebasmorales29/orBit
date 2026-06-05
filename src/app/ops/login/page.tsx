'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

export default function OpsLoginPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    const next = sp.get('next') ?? '/ops'
    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-page px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size={40} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Ops</p>
              <p className="text-[14px] font-semibold text-foreground">Acceso exclusivo</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-foreground">Iniciar sesión</h1>
          <p className="mt-2 text-[13px] text-muted">
            Este panel es privado. Si no sos operador autorizado, no hay nada que ver aquí.
          </p>

          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-3">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted-foreground">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] text-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                placeholder="tu@correo.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-muted-foreground">Contraseña</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] text-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full py-3" loading={loading}>
              Entrar a Ops
            </Button>
          </form>

          <div className="mt-4 flex justify-between text-[12px] text-muted">
            <Link href="/forgot-password" className="hover:text-foreground">
              Olvidé mi contraseña
            </Link>
            <Link href="/" className="hover:text-foreground">
              Volver al sitio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

