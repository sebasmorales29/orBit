import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { SectionLabel } from '@/components/app/SectionLabel'
import { NewLeadForm } from '@/components/leads/NewLeadForm'
import { VentasLeadsList } from '@/components/leads/VentasLeadsList'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import type { Lead, LeadStatus } from '@/types/database'
import { INQUIRY_STATUS_LABELS } from '@/types/database'

export default async function ConsultasPage() {
  const org = await getCurrentOrganization()
  const orgId = org?.id
  const supabase = await createClient()

  let leads: Lead[] = []
  if (orgId) {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    leads = (data ?? []) as Lead[]
  }

  const activeLeads = leads.filter(
    (l) => l.status !== 'ganado' && l.status !== 'perdido'
  )

  const pipeline: LeadStatus[] = ['nuevo', 'interesado', 'cotizado', 'por_cerrar']
  const byStatus = (status: LeadStatus) =>
    activeLeads.filter((l) => l.status === status).length

  return (
    <>
      <AppHeader
        title="Consultas"
        subtitle={activeLeads.length > 0 ? `${activeLeads.length} en seguimiento` : undefined}
        backHref="/hoy"
      />

      <AppMain className="space-y-5 lg:space-y-6">
        {orgId && <NewLeadForm organizationId={orgId} />}

        {activeLeads.length > 0 && (
          <div>
            <SectionLabel>Estado de consultas</SectionLabel>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
              {pipeline.map((status) => (
                <div
                  key={status}
                  className="rounded-xl border border-border bg-surface-raised py-3 text-center"
                >
                  <p className="text-lg font-semibold text-foreground">{byStatus(status)}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">
                    {INQUIRY_STATUS_LABELS[status]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <VentasLeadsList leads={leads} currency={org?.currency ?? 'CRC'} />
      </AppMain>
    </>
  )
}
