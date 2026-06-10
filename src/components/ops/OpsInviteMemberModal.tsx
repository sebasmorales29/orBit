'use client'

import { useMemo, useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { opsInviteUserToTenant } from '@/lib/platform/actions'
import type { TenantRole } from '@/types/database'

export function OpsInviteMemberModal({
  open,
  onClose,
  tenant,
  inviter,
}: {
  open: boolean
  onClose: () => void
  tenant: { id: string; name: string }
  inviter: { email: string; name: string }
}) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TenantRole>('member')
  const [expiresIn, setExpiresIn] = useState<'1h' | '24h' | '7d' | '30d'>('7d')
  const [loading, setLoading] = useState(false)

  const title = useMemo(() => {
    return 'Agregar por correo'
  }, [])

  if (!open) return null

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await opsInviteUserToTenant({
      organizationId: tenant.id,
      organizationName: tenant.name,
      inviterEmail: inviter.email,
      inviterName: inviter.name,
      email,
      role,
      expiresIn,
    })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Invitación enviada')
    setEmail('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        className="bg-scrim absolute inset-0"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {tenant.name}
            </p>
            <p className="text-[15px] font-semibold text-foreground">{title}</p>
          </div>
        </div>

        <form onSubmit={(e) => void submitInvite(e)} className="mt-5 space-y-4">
          <Input
            label="Correo a invitar"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="persona@correo.com"
            required
          />

          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Rol en el tenant
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TenantRole)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
            >
              <option value="administrator">Administrator</option>
              <option value="member">Member</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Vigencia del link
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value as typeof expiresIn)}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
            >
              <option value="1h">1 hora</option>
              <option value="24h">24 horas</option>
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
            </select>
          </div>

          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-[12px] text-muted">
            <p>
              Se enviará un correo con link al tenant, quién invitó, y si es primera vez del usuario, una contraseña
              temporal y cambio obligatorio.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Enviar invitación
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

