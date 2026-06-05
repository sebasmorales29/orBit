import { assertSuperAdmin } from '@/lib/platform/admin'
import { redirect } from 'next/navigation'
import { OpsSettingsClient } from '@/components/ops/OpsSettingsClient'

export default async function OpsSettingsPage() {
  const gate = await assertSuperAdmin()
  if (!gate.ok) redirect('/ops')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuraciones</h1>
        <p className="mt-1 text-[13px] text-muted">Preferencias del panel de operaciones.</p>
      </div>

      <OpsSettingsClient />
    </div>
  )
}
