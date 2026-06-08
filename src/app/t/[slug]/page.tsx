import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { resolvePublishedTenantBySlug } from '@/lib/platform/tenant-access'
import { tenantPublicUrl } from '@/lib/platform/tenant-slug'

export const dynamic = 'force-dynamic'

export default async function TenantPublicEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await resolvePublishedTenantBySlug(slug)
  if (!tenant) notFound()

  const publicUrl = tenantPublicUrl(tenant.slug!)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <BrandLogo href="/" size={48} />
        </div>
        <p className="mt-6 text-[11px] font-medium uppercase tracking-widest text-accent">Velum</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{tenant.name}</h1>
        {tenant.is_demo && (
          <p className="mt-2 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-[12px] text-amber-700 dark:text-amber-300">
            Entorno de demostración
          </p>
        )}
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Accedé con el correo que te invitó a este espacio de trabajo.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-foreground px-6 py-3.5 text-[14px] font-medium text-surface hover:opacity-95"
        >
          Iniciar sesión
        </Link>
        <p className="mt-4 break-all text-[11px] text-muted-foreground">{publicUrl}</p>
      </div>
      <Link href="/" className="mt-8 text-[13px] text-muted hover:text-foreground">
        ← Sitio de Velum
      </Link>
    </div>
  )
}
