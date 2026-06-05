'use client'

import Link from 'next/link'
import type { ContactRequestRow, ContactRequestStatus } from '@/lib/platform/contact-requests'

const STATUS_LABELS: Record<ContactRequestStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  demo_scheduled: 'Demo agendada',
  converted: 'Convertido',
  closed: 'Cerrado',
}

function statusBadge(status: ContactRequestStatus) {
  const styles: Record<ContactRequestStatus, string> = {
    new: 'bg-accent/15 text-accent',
    contacted: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    demo_scheduled: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    converted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    closed: 'bg-muted/20 text-muted',
  }
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function OpsContactRequests({ requests }: { requests: ContactRequestRow[] }) {
  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-[14px] text-muted">
        Aún no hay solicitudes activas desde el landing.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-foreground">{r.full_name}</p>
              {statusBadge(r.status)}
            </div>
            <p className="mt-1 text-[13px] text-muted">
              {r.email}
              {r.company_name ? ` · ${r.company_name}` : ''}
            </p>
            <p className="mt-2 line-clamp-2 text-[13px] text-muted">{r.message}</p>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {new Date(r.created_at).toLocaleString('es-CR')}
              {r.interest ? ` · ${r.interest}` : ''}
            </p>
          </div>
          <Link
            href={`/ops/inquiries/${r.id}`}
            className="shrink-0 rounded-full bg-foreground px-5 py-2.5 text-[13px] font-medium text-surface hover:opacity-95"
          >
            Procesar solicitud
          </Link>
        </li>
      ))}
    </ul>
  )
}
