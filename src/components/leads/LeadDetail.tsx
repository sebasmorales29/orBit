'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Copy, Check, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activities'
import { ensureCustomerFromLead } from '@/lib/customers'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/app/SectionLabel'
import { LeadTimeline, type ActivityRow } from '@/components/leads/LeadTimeline'
import { NewOrderForm } from '@/components/orders/NewOrderForm'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import {
  LEAD_STATUS_LABELS,
  formatMoney,
  type CurrencyCode,
  type Lead,
  type LeadStatus,
} from '@/types/database'
import { cn } from '@/lib/utils'

const STATUSES: LeadStatus[] = [
  'nuevo',
  'interesado',
  'cotizado',
  'por_cerrar',
  'ganado',
  'perdido',
]

interface Template {
  id: string
  name: string
  content: string
}

interface LeadDetailProps {
  lead: Lead
  organizationId: string
  currency: CurrencyCode
  templates: Template[]
  activities: ActivityRow[]
  customerId: string | null
}

export function LeadDetail({
  lead: initial,
  organizationId,
  currency,
  templates,
  activities: initialActivities,
  customerId: initialCustomerId,
}: LeadDetailProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const [lead, setLead] = useState(initial)
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState(initialCustomerId)
  const [activities, setActivities] = useState(initialActivities)
  const [showOrderForm, setShowOrderForm] = useState(false)

  async function updateStatus(status: LeadStatus) {
    const supabase = createClient()
    const { data } = await supabase
      .from('leads')
      .update({ status, last_contact_at: new Date().toISOString() })
      .eq('id', lead.id)
      .select()
      .single()

    if (data) {
      const updated = data as Lead
      setLead(updated)

      await logActivity(supabase, {
        organizationId,
        type: 'lead_status',
        description: `Estado: ${LEAD_STATUS_LABELS[status]}`,
        leadId: lead.id,
        metadata: { status },
      })

      if (status === 'ganado') {
        const id = await ensureCustomerFromLead(supabase, updated, organizationId)
        if (id) {
          setCustomerId(id)
          await logActivity(supabase, {
            organizationId,
            type: 'customer_created',
            description: `${updated.name} pasó a clientes`,
            leadId: lead.id,
          })
        }
      }

      const { data: refreshed } = await supabase
        .from('activities')
        .select('id, type, description, created_at')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (refreshed) setActivities(refreshed as ActivityRow[])
    }
    router.refresh()
  }

  async function saveNotes() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('leads').update({ notes }).eq('id', lead.id)
    setSaving(false)
    router.refresh()
  }

  function applyTemplate(content: string, templateId: string) {
    const text = content
      .replace(/\{nombre\}/g, lead.name)
      .replace(/\{producto\}/g, lead.product_interest ?? '')
      .replace(
        /\{monto\}/g,
        lead.estimated_amount != null ? formatMoney(lead.estimated_amount, currency) : ''
      )
    navigator.clipboard.writeText(text)
    setCopiedId(templateId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-surface">
        <SectionLabel>Estado</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateStatus(s)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                lead.status === s
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
              )}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {lead.status === 'ganado' && customerId && (
          <p className="mt-3 text-[12px] text-muted">
            {t('app.lead.clientCreated')}{' '}
            <Link href="/clientes" className="text-accent underline-offset-2 hover:underline">
              {t('app.more.clients')}
            </Link>
          </p>
        )}
      </Card>

      <Card>
        <SectionLabel>Detalle</SectionLabel>
        <dl className="mt-3 space-y-3 text-[13px]">
          {lead.phone && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Teléfono</dt>
              <dd className="text-foreground">{lead.phone}</dd>
            </div>
          )}
          {lead.product_interest && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Interés</dt>
              <dd className="text-right text-foreground">{lead.product_interest}</dd>
            </div>
          )}
          {lead.estimated_amount != null && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Monto</dt>
              <dd className="font-medium text-foreground">
                {formatMoney(lead.estimated_amount, currency)}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {(lead.status === 'ganado' || lead.status === 'por_cerrar' || lead.status === 'cotizado') && (
        <div>
          {!showOrderForm ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowOrderForm(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              {t('app.lead.createOrder')}
            </Button>
          ) : (
            <NewOrderForm
              organizationId={organizationId}
              leadId={lead.id}
              customerId={customerId ?? undefined}
              defaultTotal={lead.estimated_amount ?? undefined}
              onSuccess={() => {
                setShowOrderForm(false)
                router.refresh()
              }}
              onCancel={() => setShowOrderForm(false)}
            />
          )}
        </div>
      )}

      <div>
        <SectionLabel>Notas</SectionLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
          placeholder="—"
        />
        <Button
          variant="secondary"
          className="mt-2 w-full"
          loading={saving}
          onClick={saveNotes}
        >
          Guardar
        </Button>
      </div>

      {templates.length > 0 && (
        <div>
          <SectionLabel>Plantillas</SectionLabel>
          <div className="mt-3 space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl.content, tpl.id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-raised"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{tpl.name}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-muted">{tpl.content}</p>
                </div>
                {copiedId === tpl.id ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 shrink-0 text-muted" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <LeadTimeline activities={activities} />
    </div>
  )
}
