import { notFound, redirect } from 'next/navigation'
import { getOpsMfaStatus } from '@/lib/platform/ops-mfa'
import { assertPlatformAdmin, isOpsAccessTableReady } from '@/lib/platform/admin'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { OpsNav } from '@/components/ops/OpsNav'
import { appShellClass } from '@/components/layout/app-layout'

export default async function OpsConsoleLayout({ children }: { children: React.ReactNode }) {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    if (gate.reason === 'unauthenticated') redirect('/ops/login')
    notFound()
  }

  const status = await getOpsMfaStatus()

  if (status?.mfaRequired && !status.satisfied) {
    redirect('/ops/login')
  }

  const tableReady = await isOpsAccessTableReady()

  return (
    <div className="min-h-dvh bg-page">
      <header className="border-b border-border-subtle bg-surface/90 backdrop-blur-md">
        <div className={`${appShellClass} flex items-center justify-between gap-4 py-4`}>
          <div className="flex items-center gap-3">
            <BrandLogo href="/ops" size={36} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-accent">orBit Platform</p>
              <p className="text-[14px] font-semibold text-foreground">Operaciones</p>
            </div>
          </div>
          <OpsNav isSuper={gate.isSuper} publicHref={null} />
        </div>
      </header>

      <main className={`${appShellClass} py-8`}>
        {!tableReady && gate.isSuper && (
          <p className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[13px] text-muted">
            Ejecutá la migración{' '}
            <code className="text-[12px] text-foreground">20250530210000_platform_ops_access.sql</code>{' '}
            en Supabase para delegar operadores. Mientras tanto, solo el super admin tiene acceso.
          </p>
        )}
        {children}
      </main>
    </div>
  )
}
