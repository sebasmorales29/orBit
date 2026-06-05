'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  opsAssignUserTenantSecure,
  opsDeactivateUserSecure,
  opsDeleteUserSecure,
  opsReactivateUserSecure,
  opsStartSuperAdminEmailConfirmV2,
  opsUpdateUser,
} from '@/lib/platform/actions'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AccountStatusDot, isAuthUserSuspended } from '@/components/ui/AccountStatusDot'
import { OpsSuperAdminConfirmModal } from '@/components/ops/OpsSuperAdminConfirmModal'
import type { PlatformUserDetail } from '@/lib/platform/users-admin'
import type { TenantRole } from '@/types/database'

export function OpsUserDetail({
  user,
  canDelete,
  tenants,
}: {
  user: PlatformUserDetail
  canDelete: boolean
  tenants: { id: string; name: string }[]
}) {
  const router = useRouter()
  const toast = useToast()
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<
    | null
    | { type: 'delete' | 'deactivate' | 'reactivate' | 'assign' }
  >(null)

  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    user.organization_id ?? ''
  )
  const [selectedRole, setSelectedRole] = useState<TenantRole>(() => {
    const r = (user.member_role ?? 'member').toLowerCase()
    if (r === 'owner') return 'owner'
    if (r === 'administrator' || r === 'admin') return 'administrator'
    return 'member'
  })

  const isDisabled = useMemo(
    () => isAuthUserSuspended(user.banned_until),
    [user.banned_until]
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await opsUpdateUser(user.id, { full_name: fullName.trim() || null })
    setSaving(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Usuario actualizado')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <OpsSuperAdminConfirmModal
        open={confirm?.type === 'delete'}
        title="orBit Platform — Eliminar usuario"
        message={`Vas a eliminar la cuenta ${user.email ?? user.id}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar usuario"
        tone="danger"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('DELETE_USER')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="DELETE_USER"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          setBusy(true)
          const result = await opsDeleteUserSecure({
            userId: user.id,
            challengeId: emailChallengeId,
            code: emailCode,
          })
          setBusy(false)
          if (!result.ok) {
            toast.error(result.message)
            return
          }
          toast.success('Usuario eliminado')
          router.push('/ops/users')
        }}
      />
      <OpsSuperAdminConfirmModal
        open={confirm?.type === 'deactivate'}
        title="orBit Platform — Desactivar usuario"
        message={`Vas a desactivar la cuenta ${user.email ?? user.id}. No podrá iniciar sesión ni operar.`}
        confirmText="Desactivar"
        tone="warning"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('DEACTIVATE_USER')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="DEACTIVATE_USER"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          setBusy(true)
          const result = await opsDeactivateUserSecure({
            userId: user.id,
            challengeId: emailChallengeId,
            code: emailCode,
          })
          setBusy(false)
          if (!result.ok) {
            toast.error(result.message)
            return
          }
          toast.success('Usuario desactivado')
          setConfirm(null)
          router.refresh()
        }}
      />
      <OpsSuperAdminConfirmModal
        open={confirm?.type === 'reactivate'}
        title="orBit Platform — Reactivar usuario"
        message={`Vas a reactivar la cuenta ${user.email ?? user.id}. Podrá iniciar sesión.`}
        confirmText="Reactivar"
        tone="warning"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('REACTIVATE_USER')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="REACTIVATE_USER"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          setBusy(true)
          const result = await opsReactivateUserSecure({
            userId: user.id,
            challengeId: emailChallengeId,
            code: emailCode,
          })
          setBusy(false)
          if (!result.ok) {
            toast.error(result.message)
            return
          }
          toast.success('Usuario reactivado')
          setConfirm(null)
          router.refresh()
        }}
      />
      <OpsSuperAdminConfirmModal
        open={confirm?.type === 'assign'}
        title="orBit Platform — Asignar tenant y rol"
        message={`Vas a asignar esta cuenta a un tenant con su rol. Esto cambia sus permisos dentro de orBit.`}
        confirmText="Aplicar asignación"
        tone="warning"
        loading={busy}
        onCancel={() => setConfirm(null)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('ASSIGN_USER_TENANT')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="ASSIGN_USER_TENANT"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          if (!selectedTenantId) {
            toast.error('Seleccioná un tenant.')
            return
          }
          setBusy(true)
          const result = await opsAssignUserTenantSecure({
            userId: user.id,
            organizationId: selectedTenantId,
            role: selectedRole,
            challengeId: emailChallengeId,
            code: emailCode,
          })
          setBusy(false)
          if (!result.ok) {
            toast.error(result.message)
            return
          }
          toast.success('Asignación aplicada')
          setConfirm(null)
          router.refresh()
        }}
      />

      <Link href="/ops/users" className="text-[13px] text-muted hover:text-foreground">
        ← Usuarios
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{user.email ?? 'Usuario'}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {user.organization_id ? (
              <>
                Tenant:{' '}
                <Link className="text-accent hover:underline" href={`/ops/tenants/${user.organization_id}`}>
                  {user.organization_name ?? user.organization_id}
                </Link>{' '}
                · Rol:{' '}
                {user.member_role === 'administrator'
                  ? 'Administrator'
                  : user.member_role === 'admin'
                    ? 'Administrator'
                    : user.member_role === 'member'
                      ? 'Member'
                      : 'Owner'}
              </>
            ) : (
              'Sin tenant'
            )}
          </p>
        </div>

        {canDelete && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirm({ type: isDisabled ? 'reactivate' : 'deactivate' })}
              className="rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-raised"
            >
              {isDisabled ? 'Reactivar' : 'Desactivar'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ type: 'delete' })}
              className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-500/15 dark:text-red-400"
            >
              Eliminar
            </button>
          </div>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 rounded-2xl border border-border bg-surface p-4 text-[13px]">
            <div>
              <p className="text-muted">Estado</p>
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <AccountStatusDot status={isDisabled ? 'suspended' : 'active'} />
                <span className={isDisabled ? 'text-orange-600 dark:text-orange-400' : ''}>
                  {isDisabled ? 'Suspendido' : 'Activo'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-muted">MFA</p>
              <p className={`font-semibold ${user.mfa_enrolled ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                {user.mfa_enrolled ? 'Configurado' : 'No configurado'}
              </p>
            </div>
            <div>
              <p className="text-muted">Último acceso</p>
              <p className="font-semibold text-foreground">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-CR') : '—'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[14px] font-medium text-foreground">Información del usuario</h2>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted">
                {user.id.slice(0, 8)}
              </span>
            </div>

            <Input
              label="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre Apellido"
            />

            <Button type="submit" className="w-full" loading={saving}>
              Guardar cambios
            </Button>
          </form>

          <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-[14px] font-medium text-foreground">Tenant y rol</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Tenant
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
                >
                  <option value="">Sin tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Rol
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TenantRole)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
                >
                  <option value="administrator">Administrator</option>
                  <option value="member">Member</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setConfirm({ type: 'assign' })}
              disabled={!canDelete}
            >
              Aplicar asignación (doble verificación)
            </Button>
            {!canDelete && (
              <p className="text-[12px] text-muted">
                Solo el super admin puede asignar tenant y rol.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-[14px] font-medium text-foreground">Opciones</h2>
            <div className="mt-3 space-y-2 text-[13px] text-muted">
              <p>
                <span className="text-foreground font-medium">Creado:</span>{' '}
                {new Date(user.created_at).toLocaleString('es-CR')}
              </p>
              <p>
                <span className="text-foreground font-medium">Banned until:</span>{' '}
                {user.banned_until ? new Date(user.banned_until).toLocaleString('es-CR') : '—'}
              </p>
              <p>
                <span className="text-foreground font-medium">Tenant actual:</span>{' '}
                {user.organization_name ?? '—'}
              </p>
            </div>

            {canDelete && (
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setConfirm({ type: isDisabled ? 'reactivate' : 'deactivate' })}
                  className="rounded-xl border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-raised"
                >
                  {isDisabled ? 'Reactivar usuario' : 'Desactivar usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm({ type: 'delete' })}
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-500/15 dark:text-red-400"
                >
                  Eliminar usuario (alto riesgo)
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

