import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { LeadDetail } from '@/components/leads/LeadDetail'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import type { Lead } from '@/types/database'

export default async function ConsultaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const org = await getCurrentOrganization()
  if (!org) notFound()

  const supabase = await createClient()
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  if (!lead) notFound()

  const [{ data: templates }, { data: activities }, { data: customer }] = await Promise.all([
    supabase
      .from('message_templates')
      .select('id, name, content')
      .eq('organization_id', org.id),
    supabase
      .from('activities')
      .select('id, type, description, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('customers')
      .select('id')
      .eq('lead_id', id)
      .maybeSingle(),
  ])

  return (
    <>
      <AppHeader title={(lead as Lead).name} backHref="/consultas" />
      <AppMain className="max-w-3xl lg:max-w-none">
        <LeadDetail
          lead={lead as Lead}
          organizationId={org.id}
          currency={org.currency}
          templates={templates ?? []}
          activities={activities ?? []}
          customerId={customer?.id ?? null}
        />
      </AppMain>
    </>
  )
}
