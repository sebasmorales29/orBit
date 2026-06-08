'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Trash2, Archive } from 'lucide-react'
import {
  opsArchiveContactRequest,
  opsDeleteContactRequest,
  opsSendContactRequestEmail,
  opsUpdateContactRequestNotes,
  opsUpdateContactRequestStatus,
} from '@/lib/platform/actions'
import type { ContactRequestRow, ContactRequestStatus } from '@/lib/platform/contact-requests'
import { useAppDialog } from '@/components/ui/app-dialog'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

const STATUS_LABELS: Record<ContactRequestStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  demo_scheduled: 'Demo agendada',
  converted: 'Convertido',
  closed: 'Cerrado',
}

export function OpsContactRequestDetail({ request }: { request: ContactRequestRow }) {
  const router = useRouter()
  const toast = useToast()
  const dialog = useAppDialog()
  const [status, setStatus] = useState(request.status)
  const [notes, setNotes] = useState(request.ops_notes ?? '')
  const [subject, setSubject] = useState(`Velum — seguimiento a tu solicitud`)
  const [emailBody, setEmailBody] = useState(
    `Hola ${request.full_name.split(' ')[0] ?? request.full_name},\n\nGracias por escribirnos. `
  )
  const [busy, setBusy] = useState<string | null>(null)

  async function saveStatus(next: ContactRequestStatus) {
    setBusy('status')
    const result = await opsUpdateContactRequestStatus(request.id, next)
    setBusy(null)
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Error')
      return
    }
    setStatus(next)
    toast.success('Estado actualizado')
    router.refresh()
  }

  async function saveNotes() {
    setBusy('notes')
    const result = await opsUpdateContactRequestNotes(request.id, notes)
    setBusy(null)
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Error')
      return
    }
    toast.success('Notas guardadas')
    router.refresh()
  }

  async function sendEmail() {
    setBusy('email')
    const result = await opsSendContactRequestEmail({
      id: request.id,
      subject,
      body: emailBody,
    })
    setBusy(null)
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Error al enviar')
      return
    }
    setStatus(status === 'new' ? 'contacted' : status)
    toast.success('Correo enviado')
    router.refresh()
  }

  async function archive() {
    const ok = await dialog.confirm({
      title: 'Archivar solicitud',
      message: '¿Archivar esta solicitud? Seguirá en métricas pero saldrá de la lista activa.',
      confirmText: 'Archivar',
      tone: 'warning',
    })
    if (!ok) return
    setBusy('archive')
    const result = await opsArchiveContactRequest(request.id)
    setBusy(null)
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Error')
      return
    }
    toast.success('Solicitud archivada')
    router.push('/ops/inquiries')
  }

  async function remove() {
    const ok = await dialog.confirm({
      title: 'Eliminar solicitud',
      message: '¿Eliminar permanentemente esta solicitud? No se puede deshacer.',
      confirmText: 'Eliminar',
      tone: 'danger',
    })
    if (!ok) return
    setBusy('delete')
    const result = await opsDeleteContactRequest(request.id)
    setBusy(null)
    if (!result.ok) {
      toast.error('message' in result ? result.message : 'Error')
      return
    }
    toast.success('Solicitud eliminada')
    router.push('/ops/inquiries')
  }

  const mailto = `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(subject)}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/ops/inquiries"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a solicitudes
        </Link>
      </div>

      <header className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{request.full_name}</h1>
            <p className="mt-1 text-[14px] text-muted">
              {request.email}
              {request.company_name ? ` · ${request.company_name}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={mailto}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] font-medium hover:bg-surface-raised"
            >
              <Mail className="h-4 w-4" />
              Abrir en correo
            </a>
            <Button
              type="button"
              variant="secondary"
              loading={busy === 'archive'}
              onClick={() => void archive()}
            >
              <Archive className="h-4 w-4" />
              Archivar
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={busy === 'delete'}
              onClick={() => void remove()}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
          {request.phone && (
            <div>
              <dt className="text-muted">Teléfono</dt>
              <dd className="font-medium text-foreground">{request.phone}</dd>
            </div>
          )}
          {request.role_title && (
            <div>
              <dt className="text-muted">Rol</dt>
              <dd className="text-foreground">{request.role_title}</dd>
            </div>
          )}
          {request.team_size && (
            <div>
              <dt className="text-muted">Equipo</dt>
              <dd className="text-foreground">{request.team_size}</dd>
            </div>
          )}
          {request.interest && (
            <div>
              <dt className="text-muted">Interés</dt>
              <dd className="text-foreground">{request.interest}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Preferencia</dt>
            <dd className="text-foreground">{request.preferred_contact}</dd>
          </div>
          <div>
            <dt className="text-muted">Recibida</dt>
            <dd className="text-foreground">
              {new Date(request.created_at).toLocaleString('es-CR')}
            </dd>
          </div>
          {request.last_contacted_at && (
            <div>
              <dt className="text-muted">Último contacto</dt>
              <dd className="text-foreground">
                {new Date(request.last_contacted_at).toLocaleString('es-CR')}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Mensaje original
          </p>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-raised px-4 py-3 text-[14px] leading-relaxed text-foreground">
            {request.message}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-foreground">Estado del pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as ContactRequestStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy === 'status'}
              onClick={() => void saveStatus(s)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                status === s
                  ? 'bg-foreground text-surface'
                  : 'border border-border text-muted hover:text-foreground'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-foreground">Enviar correo desde Velum</h2>
        <p className="text-[13px] text-muted">
          Usa Resend (si está configurado). Al enviar, marcamos contacto y actualizamos métricas.
        </p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px]"
          placeholder="Asunto"
        />
        <textarea
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] leading-relaxed"
          placeholder="Mensaje para el cliente"
        />
        <Button type="button" loading={busy === 'email'} onClick={() => void sendEmail()}>
          Enviar correo al cliente
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-foreground">Notas internas (ops)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] leading-relaxed"
          placeholder="Seguimiento, próximos pasos, contexto del demo…"
        />
        <Button type="button" variant="secondary" loading={busy === 'notes'} onClick={() => void saveNotes()}>
          Guardar notas
        </Button>
      </section>
    </div>
  )
}
