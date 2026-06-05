import Link from 'next/link'
import { OpsCreateTenantForm } from '@/components/ops/OpsCreateTenantForm'
import { listTenantPacks } from '@/lib/platform/packs'

export default function OpsNewTenantPage() {
  const packs = listTenantPacks()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ops/tenants" className="text-[13px] text-muted hover:text-foreground">
          ← Tenants
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Crear tenant
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          Aprovisioná un negocio con pack, plantillas, panel y perfil listos. El owner recibe
          invitación por correo si aún no tiene cuenta.
        </p>
      </div>

      <OpsCreateTenantForm packs={packs} />
    </div>
  )
}
