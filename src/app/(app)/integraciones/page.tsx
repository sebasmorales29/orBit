import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { IntegracionesPanel } from '@/components/integrations/IntegracionesPanel'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import type { IntegrationConnectionRow } from '@/lib/integrations/types'

function webhookBaseUrl(): string {
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (app) return `${app}/api/connect/v1/orders`
  return 'https://tu-dominio.com/api/connect/v1/orders'
}

export default async function IntegracionesPage() {
  const org = await getCurrentOrganization()
  const supabase = await createClient()

  let connections: IntegrationConnectionRow[] = []
  if (org?.id) {
    const { data } = await supabase
      .from('integration_connections')
      .select(
        'id, organization_id, name, provider, secret_prefix, active, settings, last_used_at, created_at'
      )
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
    connections = (data ?? []) as IntegrationConnectionRow[]
  }

  return (
    <>
      <AppHeader title="Integraciones" />
      <AppMain>
        <IntegracionesPanel connections={connections} webhookUrl={webhookBaseUrl()} />
      </AppMain>
    </>
  )
}
