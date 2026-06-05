'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { opsUpdateContactRequestStatus } from '@/lib/platform/actions'
import type { ContactRequestRow, ContactRequestStatus } from '@/lib/platform/contact-requests'
import { useToast } from '@/components/ui/toast'

const STATUS_LABELS: Record<ContactRequestStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  demo_scheduled: 'Demo agendada',
  converted: 'Convertido',
  closed: 'Cerrado',
}

export function OpsContactRequests({ requests }: { requests: ContactRequestRow[] }) {
  const router = useRouter()
  const toast = useToast()
  const [updating, setUpdating] = useState<string | null>(null)

  async function setStatus(id: string, status: ContactRequestStatus) {
    setUpdating(id)
    const result = await opsUpdateContactRequestStatus(id, status)
    setUpdating(null)
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Error')
      return
    }
    toast.success('Estado actualizado')
    router.refresh()
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-[14px] text-muted">
        Aún no hay solicitudes desde el landing.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {requests.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-foreground">{r.full_name}</p>
              <p className="text-[13px] text-muted">
                {r.email}
                {r.company_name ? ` · ${r.company_name}` : ''}
              </p>
            </div>
            <select
              value={r.status}
              disabled={updating === r.id}
              onChange={(e) => setStatus(r.id, e.target.value as ContactRequestStatus)}
              className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-[13px]"
            >
              {(Object.keys(STATUS_LABELS) as ContactRequestStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
            {r.phone && (
              <div>
                <dt className="text-muted">Teléfono</dt>
                <dd className="text-foreground">{r.phone}</dd>
              </div>
            )}
            {r.role_title && (
              <div>
                <dt className="text-muted">Rol</dt>
                <dd className="text-foreground">{r.role_title}</dd>
              </div>
            )}
            {r.team_size && (
              <div>
                <dt className="text-muted">Equipo</dt>
                <dd className="text-foreground">{r.team_size}</dd>
              </div>
            )}
            {r.interest && (
              <div>
                <dt className="text-muted">Interés</dt>
                <dd className="text-foreground">{r.interest}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Preferencia</dt>
              <dd className="text-foreground">{r.preferred_contact}</dd>
            </div>
            <div>
              <dt className="text-muted">Fecha</dt>
              <dd className="text-foreground">{new Date(r.created_at).toLocaleString('es-CR')}</dd>
            </div>
          </dl>
          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-surface-raised px-4 py-3 text-[13px] leading-relaxed text-foreground">
            {r.message}
          </p>
        </li>
      ))}
    </ul>
  )
}
