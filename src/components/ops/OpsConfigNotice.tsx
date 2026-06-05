import Link from 'next/link'
import {
  getSessionUserEmail,
  getSuperAdminEmail,
  isPlatformAdminEmail,
} from '@/lib/platform/admin'
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/env'

type OpsConfigIssue = 'service_role' | 'super_admin' | 'not_admin' | 'supabase'

export async function OpsConfigNotice() {
  const issues: OpsConfigIssue[] = []

  if (!isSupabaseConfigured()) issues.push('supabase')
  if (!isServiceRoleConfigured()) issues.push('service_role')

  const superEmail = getSuperAdminEmail()
  if (!superEmail) issues.push('super_admin')
  else {
    const sessionEmail = await getSessionUserEmail()
    const allowed = await isPlatformAdminEmail(sessionEmail)
    if (!allowed) issues.push('not_admin')
  }

  if (issues.length === 0) return null

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-6">
      <h1 className="text-lg font-semibold text-foreground">Configuración pendiente</h1>
      <p className="text-[14px] leading-relaxed text-muted">
        La consola <strong className="font-medium text-foreground">/ops</strong> es exclusiva del
        super administrador y operadores que vos autorices.
      </p>

      <ul className="space-y-4 text-[13px] text-foreground">
        {issues.includes('service_role') && (
          <li className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="font-medium text-red-700 dark:text-red-300">
              Falta SUPABASE_SERVICE_ROLE_KEY
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-raised p-3 text-[12px] text-muted">
              SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_clave_aqui
            </pre>
          </li>
        )}

        {issues.includes('super_admin') && (
          <li className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="font-medium">Falta el super administrador</p>
            <pre className="mt-2 rounded-lg bg-surface p-3 text-[12px] text-muted">
              ORBIT_PLATFORM_SUPER_ADMIN_EMAIL=tu-correo@ejemplo.com
            </pre>
            <p className="mt-2 text-[12px] text-muted">
              Solo este correo puede gestionar accesos y MFA en /ops/access.
            </p>
          </li>
        )}

        {issues.includes('not_admin') && (
          <li className="rounded-xl border border-border bg-surface-raised p-4 text-muted">
            Tu sesión no tiene permiso para esta área.
          </li>
        )}

        {issues.includes('supabase') && (
          <li className="rounded-xl border border-border bg-surface-raised p-4 text-muted">
            Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.
          </li>
        )}
      </ul>

      <Link href="/hoy" className="inline-block text-[13px] text-accent hover:underline">
        Volver a la app
      </Link>
    </div>
  )
}
