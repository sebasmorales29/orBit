'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { OpsDirectLoginForm } from '@/components/ops/OpsDirectLoginForm'
import { OpsMfaSetup } from '@/components/ops/OpsMfaSetup'
import { createClient } from '@/lib/supabase/client'
import type { OpsMfaStatus } from '@/lib/platform/ops-mfa'

type SessionPayload = {
  configured: boolean
  authenticated: boolean
  admin: boolean
  email?: string
  isSuper?: boolean
  mfa?: OpsMfaStatus | null
}

type SessionStatus = { loading: true } | ({ loading: false } & SessionPayload)

interface OpsLoginGateProps {
  nextHref: string
}

async function fetchSessionStatus(): Promise<SessionPayload> {
  const res = await fetch('/api/ops/session-status', {
    cache: 'no-store',
    credentials: 'include',
  })
  return (await res.json()) as SessionPayload
}

export function OpsLoginGate({ nextHref }: OpsLoginGateProps) {
  const router = useRouter()
  const [status, setStatus] = useState<SessionStatus>({ loading: true })

  const reload = useCallback(async () => {
    setStatus({ loading: true })
    try {
      const data = await fetchSessionStatus()
      setStatus({ loading: false, ...data })
    } catch {
      setStatus({ loading: false, configured: false, authenticated: false, admin: false })
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const supabase = createClient()
        await supabase.auth.getSession()
        const data = await fetchSessionStatus()
        if (!cancelled) {
          setStatus({ loading: false, ...data })
        }
      } catch {
        if (!cancelled) {
          setStatus({ loading: false, configured: false, authenticated: false, admin: false })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status.loading) return
    if (!status.configured) return
    if (!status.authenticated || !status.admin) return
    if (!status.mfa) return
    if (status.mfa.mfaRequired && !status.mfa.satisfied) return
    router.replace(nextHref)
  }, [status, nextHref, router])

  if (status.loading) {
    return (
      <div className="min-h-dvh bg-page px-4 py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-6 text-[13px] text-muted">
          Verificando acceso…
        </div>
      </div>
    )
  }

  if (!status.configured) {
    return (
      <GateCard title="Ops no configurado">
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Falta configurar <code className="text-foreground">ORBIT_PLATFORM_SUPER_ADMIN_EMAIL</code> y{' '}
          <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> en Vercel.
        </p>
      </GateCard>
    )
  }

  if (!status.authenticated) {
    return (
      <GateCard title="Acceso a Operaciones">
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Iniciá sesión con tu cuenta de super administrador o usá el enlace privado de entrada.
        </p>
        <OpsDirectLoginForm onSuccess={() => void reload()} />
        <p className="mt-4 text-[13px] font-medium text-foreground">Enlace privado:</p>
        <p className="mt-2 rounded-xl border border-border bg-surface-raised px-3 py-2 font-mono text-[12px] text-foreground">
          /ops/entry/TU_TOKEN
        </p>
      </GateCard>
    )
  }

  if (!status.admin) {
    return (
      <GateCard title="Sin permiso">
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          La cuenta <span className="text-foreground">{status.email}</span> no tiene acceso a Operaciones.
        </p>
      </GateCard>
    )
  }

  if (!status.mfa) {
    return (
      <GateCard title="Error de acceso">
        <p className="mt-2 text-[13px] text-muted">
          No se pudo validar MFA. Cerrá sesión, volvé a iniciar sesión o abrí tu enlace de entrada.
        </p>
        <OpsDirectLoginForm onSuccess={() => void reload()} />
      </GateCard>
    )
  }

  if (!status.mfa.mfaRequired || status.mfa.satisfied) {
    return (
      <div className="min-h-dvh bg-page px-4 py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-6 text-[13px] text-muted">
          Redirigiendo a Operaciones…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-page px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size={40} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Ops</p>
              <p className="text-[14px] font-semibold text-foreground">Verificación MFA</p>
            </div>
          </div>

          <p className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-muted">
            Sesión válida como <span className="text-foreground">{status.email}</span>. Completá MFA para entrar.
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-foreground">Código de autenticador</h1>
          <p className="mt-2 text-[13px] text-muted">
            Ingresá el código de 6 dígitos de tu app de autenticación. Si falla, esperá el próximo código (30 s).
          </p>

          <div className="mt-6">
            <OpsMfaSetup
              hasVerifiedFactor={status.mfa.hasVerifiedFactor}
              sessionAal2={status.mfa.sessionAal2}
              nextHref={nextHref}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function GateCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-page px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size={40} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Ops</p>
              <p className="text-[14px] font-semibold text-foreground">Acceso privado</p>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
