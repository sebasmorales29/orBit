'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  opsDeleteTenantSecure,
  opsRemoveTenantMember,
  opsRevokeTenantInvite,
  opsSetTenantInviteRole,
  opsSetTenantMemberRole,
  opsStartSuperAdminEmailConfirmV2,
  opsSuspendTenantSecure,
  opsUpdateTenant,
} from '@/lib/platform/actions'
import type { TenantDetail } from '@/lib/platform/tenant-admin'
import { parseAllowedDomains, tenantPublicUrl } from '@/lib/platform/tenant-slug'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'
import { formatMoney } from '@/types/database'
import type { CurrencyCode } from '@/types/database'
import { OpsSuperAdminConfirmModal } from '@/components/ops/OpsSuperAdminConfirmModal'
import { OpsInviteMemberModal } from '@/components/ops/OpsInviteMemberModal'
import type { TenantRole } from '@/types/database'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export function OpsTenantDetail({ tenant, canDelete }: { tenant: TenantDetail; canDelete: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [name, setName] = useState(tenant.name)
  const [platformStatus, setPlatformStatus] = useState(tenant.platform_status)
  const [planTier, setPlanTier] = useState(tenant.plan_tier)
  const [monthlyFee, setMonthlyFee] = useState(String((tenant.monthly_fee_cents / 100).toFixed(2)))
  const [notes, setNotes] = useState(tenant.platform_notes ?? '')
  const [slug, setSlug] = useState(tenant.slug ?? '')
  const [maxMembers, setMaxMembers] = useState(
    tenant.max_members != null ? String(tenant.max_members) : ''
  )
  const [allowedDomains, setAllowedDomains] = useState(
    tenant.allowed_email_domains.join(', ')
  )
  const [isDemo, setIsDemo] = useState(tenant.is_demo)
  const [publishUrl, setPublishUrl] = useState(tenant.public_url_published)
  const [usesStock, setUsesStock] = useState(tenant.uses_stock)
  const [currency, setCurrency] = useState(tenant.currency)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleChange, setRoleChange] = useState<
    | null
    | {
        kind: 'member'
        userId: string
        email: string | null
        role: TenantRole
      }
    | {
        kind: 'invite'
        inviteId: string
        email: string
        role: TenantRole
      }
  >(null)
  const [roleChanging, setRoleChanging] = useState(false)
  const [revoke, setRevoke] = useState<null | { inviteId: string; email: string }>(null)
  const [revoking, setRevoking] = useState(false)
  const [remove, setRemove] = useState<null | { userId: string; email: string | null }>(null)
  const [removing, setRemoving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const cents = Math.round(parseFloat(monthlyFee.replace(',', '.')) * 100) || 0
    const result = await opsUpdateTenant(tenant.id, {
      name: name.trim(),
      platform_status: platformStatus,
      plan_tier: planTier,
      monthly_fee_cents: cents,
      platform_notes: notes.trim() || null,
      slug: slug.trim() || null,
      max_members: maxMembers.trim() ? parseInt(maxMembers, 10) : null,
      allowed_email_domains: parseAllowedDomains(allowedDomains),
      is_demo: isDemo,
      public_url_published: publishUrl,
      uses_stock: usesStock,
      currency: currency as CurrencyCode,
    })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Tenant actualizado')
    router.refresh()
  }

  async function runDelete(emailChallengeId: string, emailCode: string) {
    setDeleting(true)
    const result = await opsDeleteTenantSecure({
      orgId: tenant.id,
      challengeId: emailChallengeId,
      code: emailCode,
    })
    setDeleting(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Tenant eliminado')
    router.push('/ops/tenants')
  }

  async function runSuspend(emailChallengeId: string, emailCode: string, suspended: boolean) {
    setSaving(true)
    const result = await opsSuspendTenantSecure({
      orgId: tenant.id,
      suspended,
      challengeId: emailChallengeId,
      code: emailCode,
    })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(suspended ? 'Tenant suspendido' : 'Tenant reactivado')
    router.refresh()
  }

  async function runChangeRole() {
    if (!roleChange) return
    setRoleChanging(true)
    const result =
      roleChange.kind === 'member'
        ? await opsSetTenantMemberRole({
            organizationId: tenant.id,
            userId: roleChange.userId,
            role: roleChange.role,
          })
        : await opsSetTenantInviteRole({
            organizationId: tenant.id,
            inviteId: roleChange.inviteId,
            role: roleChange.role,
          })
    setRoleChanging(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Rol actualizado')
    router.refresh()
  }

  async function runRevoke(inviteId: string) {
    setRevoking(true)
    const result = await opsRevokeTenantInvite({
      organizationId: tenant.id,
      inviteId,
    })
    setRevoking(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Invitación revocada')
    router.refresh()
  }

  async function runRemoveMember(userId: string) {
    setRemoving(true)
    const result = await opsRemoveTenantMember({
      organizationId: tenant.id,
      userId,
    })
    setRemoving(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Usuario removido del tenant')
    router.refresh()
  }

  const createdAt = new Date(tenant.created_at)
  const daysRunning = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <OpsInviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        tenant={{ id: tenant.id, name: tenant.name }}
        inviter={{
          email: tenant.ownerEmail ?? 'superadmin@orbit',
          name: tenant.ownerName ?? 'Super Admin',
        }}
      />
      <OpsSuperAdminConfirmModal
        open={confirmDelete}
        title="Velum Platform — Eliminar tenant"
        message={`Vas a eliminar “${tenant.name}” y TODOS sus datos. Esta acción no se puede deshacer.`}
        confirmText="Eliminar tenant"
        tone="danger"
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('DELETE_TENANT')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="DELETE_TENANT"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          setConfirmDelete(false)
          await runDelete(emailChallengeId, emailCode)
        }}
      />
      <ConfirmModal
        open={!!revoke}
        title="Velum Platform — Revocar invitación"
        message={revoke ? `Vas a revocar la invitación enviada a ${revoke.email}.` : ''}
        confirmText="Revocar"
        tone="danger"
        loading={revoking}
        onCancel={() => setRevoke(null)}
        onConfirm={() => {
          const current = revoke
          setRevoke(null)
          if (!current) return
          void runRevoke(current.inviteId)
        }}
      />
      <ConfirmModal
        open={!!remove}
        title="Velum Platform — Remover usuario"
        message={
          remove
            ? `Vas a remover a ${remove.email ?? 'este usuario'} del tenant. Para volver a tener acceso debe ser invitado de nuevo.`
            : ''
        }
        confirmText="Remover"
        tone="danger"
        loading={removing}
        onCancel={() => setRemove(null)}
        onConfirm={() => {
          const current = remove
          setRemove(null)
          if (!current) return
          void runRemoveMember(current.userId)
        }}
      />
      <OpsSuperAdminConfirmModal
        open={confirmSuspend}
        title={`Velum Platform — ${platformStatus === 'suspended' ? 'Activar tenant' : 'Desactivar tenant'}`}
        message={
          platformStatus === 'suspended'
            ? `Vas a activar “${tenant.name}”.`
            : `Vas a desactivar “${tenant.name}”. Esto bloquea la operación del tenant hasta activación.`
        }
        confirmText={platformStatus === 'suspended' ? 'Activar' : 'Desactivar'}
        tone="warning"
        loading={saving}
        onCancel={() => setConfirmSuspend(false)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('SUSPEND_TENANT')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="SUSPEND_TENANT"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          setConfirmSuspend(false)
          await runSuspend(emailChallengeId, emailCode, platformStatus !== 'suspended')
        }}
      />
      <ConfirmModal
        open={!!roleChange}
        title="Cambiar rol"
        message={
          roleChange
            ? `Vas a cambiar el rol de ${roleChange.email ?? 'este usuario'} a “${roleChange.role}”.`
            : ''
        }
        confirmText="Cambiar rol"
        tone="warning"
        loading={roleChanging}
        onCancel={() => setRoleChange(null)}
        onConfirm={() => {
          setRoleChange(null)
          void runChangeRole()
        }}
      />
      <Link href="/ops/tenants" className="text-[13px] text-muted hover:text-foreground">
        ← Tenants
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{tenant.name}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {tenant.ownerName ?? '—'} · {tenant.ownerEmail ?? '—'} · Pack: {tenant.packId ?? '—'}
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 rounded-2xl border border-border bg-surface p-4 text-[13px]">
            <div>
              <p className="text-muted">Pedidos</p>
              <p className="font-semibold text-foreground">{tenant.ordersCount}</p>
            </div>
            <div>
              <p className="text-muted">Total ventas</p>
              <p className="font-semibold text-foreground">
                {formatMoney(tenant.ordersTotal, tenant.currency as CurrencyCode)}
              </p>
            </div>
            <div>
              <p className="text-muted">Tiempo corriendo</p>
              <p className="font-semibold text-foreground">{daysRunning} días</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[14px] font-medium text-foreground">Información del tenant</h2>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted">
                {platformStatus}
              </span>
            </div>

            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Estado
                </label>
                <select
                  value={platformStatus}
                  onChange={(e) => setPlatformStatus(e.target.value as typeof platformStatus)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Plan
                </label>
                <select
                  value={planTier}
                  onChange={(e) => setPlanTier(e.target.value as typeof planTier)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
                >
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <Input
              label="Cuota mensual (USD)"
              type="number"
              min={0}
              step="0.01"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Notas internas (CEO)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px]"
              />
            </div>

            <div className="border-t border-border-subtle pt-4 space-y-4">
              <h3 className="text-[13px] font-medium text-foreground">Acceso del tenant</h3>
              <Input
                label="Slug (URL pública)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mi-empresa"
              />
              {slug.trim() && (
                <p className="text-[12px] text-muted break-all">
                  {publishUrl ? tenantPublicUrl(slug.trim().toLowerCase()) : `Borrador: /t/${slug.trim().toLowerCase()} (no publicado)`}
                </p>
              )}
              <Input
                label="Límite de usuarios"
                type="number"
                min={1}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                placeholder="Sin límite"
              />
              <p className="text-[12px] text-muted">
                Cupo usado: {tenant.seatCount}
                {tenant.max_members != null ? ` / ${tenant.max_members}` : ''}
              </p>
              <Input
                label="Dominios permitidos (@)"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="empresa.com (vacío = cualquiera)"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
                  >
                    <option value="CRC">CRC</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Inventario
                  </label>
                  <select
                    value={usesStock ? 'on' : 'off'}
                    onChange={(e) => setUsesStock(e.target.value === 'on')}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
                  >
                    <option value="on">Activo</option>
                    <option value="off">Inactivo</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" checked={isDemo} onChange={(e) => setIsDemo(e.target.checked)} />
                Demo
              </label>
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={publishUrl}
                  onChange={(e) => setPublishUrl(e.target.checked)}
                />
                URL pública publicada
              </label>
            </div>

            <Button type="submit" className="w-full" loading={saving}>
              Guardar cambios
            </Button>
          </form>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-[14px] font-medium text-foreground">Opciones</h2>
            <div className="mt-3 space-y-2 text-[13px] text-muted">
              <p>
                <span className="text-foreground font-medium">ID:</span> {tenant.id}
              </p>
              <p>
                <span className="text-foreground font-medium">Creado:</span>{' '}
                {new Date(tenant.created_at).toLocaleString('es-CR')}
              </p>
              <p>
                <span className="text-foreground font-medium">Moneda:</span> {tenant.currency}
              </p>
              <p>
                <span className="text-foreground font-medium">Stock:</span>{' '}
                {tenant.uses_stock ? 'Activado' : 'No usa'}
              </p>
            </div>
            {canDelete && (
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-raised"
                >
                  Agregar usuario
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSuspend(true)}
                  className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-raised"
                >
                  {platformStatus === 'suspended' ? 'Activar tenant' : 'Desactivar tenant'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-500/15 dark:text-red-400"
                >
                  Eliminar tenant
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-[14px] font-medium text-foreground">Miembros</h2>
            <ul className="mt-3 space-y-2 text-[13px]">
              {tenant.invites?.map((inv) => (
                <li key={inv.id} className="flex justify-between text-muted">
                  <span className="truncate pr-2">{inv.email}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-amber-500"
                      aria-label="Pendiente"
                      title="Pendiente"
                    />
                    <select
                      value={(inv.role === 'admin' ? 'administrator' : inv.role) as TenantRole}
                      onChange={(e) =>
                        setRoleChange({
                          kind: 'invite',
                          inviteId: inv.id,
                          email: inv.email,
                          role: e.target.value as TenantRole,
                        })
                      }
                      className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-[12px] text-foreground"
                    >
                      <option value="administrator">Administrator</option>
                      <option value="member">Member</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setRevoke({ inviteId: inv.id, email: inv.email })}
                      className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-[12px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
                      aria-label="Revocar"
                      title="Revocar"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
              {tenant.members.map((m) => (
                <li key={m.user_id} className="flex justify-between text-muted">
                  <span className="truncate pr-2">{m.email ?? m.user_id}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                      aria-label="Miembro"
                      title="Miembro"
                    />
                    <select
                      value={(m.role === 'admin' ? 'administrator' : m.role) as TenantRole}
                      onChange={(e) =>
                        setRoleChange({
                          kind: 'member',
                          userId: m.user_id,
                          email: m.email,
                          role: e.target.value as TenantRole,
                        })
                      }
                      className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-[12px] text-foreground"
                    >
                      <option value="administrator">Administrator</option>
                      <option value="member">Member</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setRemove({ userId: m.user_id, email: m.email })}
                      className="rounded-lg border border-border bg-surface-raised px-2 py-1 text-[12px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
                      aria-label="Remover"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
