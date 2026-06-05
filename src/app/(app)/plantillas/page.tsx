import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { TemplatesClient } from '@/components/templates/TemplatesClient'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'

export default async function PlantillasPage() {
  const org = await getCurrentOrganization()
  const orgId = org?.id
  const supabase = await createClient()

  let templates: { id: string; name: string; content: string; category: string }[] = []
  if (orgId) {
    const { data } = await supabase
      .from('message_templates')
      .select('id, name, content, category')
      .eq('organization_id', orgId)
      .order('name')
    templates = data ?? []
  }

  return (
    <>
      <AppHeader title="Plantillas" backHref="/mas" />
      <AppMain>
        {orgId ? (
          <TemplatesClient organizationId={orgId} initialTemplates={templates} />
        ) : (
          <p className="text-center text-muted">Configurá tu negocio primero.</p>
        )}
      </AppMain>
    </>
  )
}
