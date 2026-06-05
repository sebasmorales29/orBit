'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  opsAddAccessAdminSecure,
  opsDisableUserMfaSecure,
  opsRemoveAccessAdminSecure,
  opsSetAccessMfaRequiredSecure,
  opsStartSuperAdminEmailConfirmV2,
} from '@/lib/platform/actions'
import type { OpsAdminRow } from '@/lib/platform/ops-access'
import { Button } from '@/components/ui/Button'
import { OpsAccessAdminDetailModal } from '@/components/ops/OpsAccessAdminDetailModal'
import { OpsSuperAdminConfirmModal } from '@/components/ops/OpsSuperAdminConfirmModal'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'

export function OpsAccessClient({ admins }: { admins: OpsAdminRow[] }) {
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [detailAdmin, setDetailAdmin] = useState<OpsAdminRow | null>(null)
  const [superAction, setSuperAction] = useState<
    | null
    | (
        | { type: 'add'; email: string }
        | { type: 'remove'; id: string; email: string }
        | { type: 'toggleMfa'; id: string; email: string; nextRequired: boolean }
        | { type: 'disableMfa'; userId: string | null; email: string }
      )
  >(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    setSuperAction({ type: 'add', email: normalized })
  }

  function toggleMfaRequired(row: OpsAdminRow) {
    if (row.is_super) return
    setSuperAction({
      type: 'toggleMfa',
      id: row.id,
      email: row.email,
      nextRequired: !row.mfa_required,
    })
  }

  function disableMfa(row: OpsAdminRow) {
    setSuperAction({
      type: 'disableMfa',
      userId: row.user_id ?? null,
      email: row.email,
    })
  }

  function removeAccess(row: OpsAdminRow) {
    setSuperAction({ type: 'remove', id: row.id, email: row.email })
  }

  return (
    <div className="space-y-8">
      <OpsAccessAdminDetailModal admin={detailAdmin} onClose={() => setDetailAdmin(null)} />
      <OpsSuperAdminConfirmModal
        open={Boolean(superAction)}
        title="orBit Platform — Seguridad reforzada"
        message="Vas a aplicar un cambio sensible en Operaciones. Confirmá con MFA y con el código enviado a tu correo."
        confirmText="Confirmar"
        tone="danger"
        loading={!!busyId}
        onCancel={() => setSuperAction(null)}
        onRequestEmailCode={async () => {
          const result = await opsStartSuperAdminEmailConfirmV2('OPS_ACCESS_CHANGE')
          if (!result.ok) {
            toast.error(result.message)
            throw new Error(result.message)
          }
          toast.success('Código enviado al correo')
          return result.challengeId
        }}
        emailPurpose="OPS_ACCESS_CHANGE"
        onConfirmed={async ({ emailChallengeId, emailCode }) => {
          const a = superAction
          if (!a) return

          setBusyId('super-op')
          let ok = true
          let message = ''

          if (a.type === 'add') {
            const result = await opsAddAccessAdminSecure({
              email: a.email,
              challengeId: emailChallengeId,
              code: emailCode,
            })
            ok = result.ok
            message = result.ok ? 'Acceso a /ops concedido' : result.message
          } else if (a.type === 'remove') {
            const result = await opsRemoveAccessAdminSecure({
              id: a.id,
              challengeId: emailChallengeId,
              code: emailCode,
            })
            ok = result.ok
            message = result.ok ? 'Acceso revocado' : result.message
          } else if (a.type === 'toggleMfa') {
            const result = await opsSetAccessMfaRequiredSecure({
              id: a.id,
              required: a.nextRequired,
              challengeId: emailChallengeId,
              code: emailCode,
            })
            ok = result.ok
            message = result.ok
              ? a.nextRequired
                ? 'MFA obligatorio'
                : 'MFA opcional para este operador'
              : result.message
          } else if (a.type === 'disableMfa') {
            const result = await opsDisableUserMfaSecure({
              userId: a.userId,
              email: a.email,
              challengeId: emailChallengeId,
              code: emailCode,
            })
            ok = result.ok
            message = result.ok
              ? result.data.removed > 0
                ? `MFA desactivado (${result.data.removed} factor/es)`
                : 'El usuario no tenía MFA activo'
              : result.message
          }

          setBusyId(null)
          if (!ok) toast.error(message)
          else toast.success(message)

          if (ok) {
            setEmail('')
            setSuperAction(null)
            router.refresh()
          }
        }}
      />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Acceso a Operaciones</h1>
        <p className="mt-1 text-[14px] text-muted">
          Solo vos (super admin) gestionás quién puede entrar a <code className="text-[12px]">/ops</code>.
          Los operadores delegados no ven esta pantalla.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleAdd(e)}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="Agregar operador por correo"
            type="email"
            placeholder="operador@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit">
          Agregar a /ops
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-raised text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">MFA</th>
              <th className="px-4 py-3">Política</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((row) => (
              <tr key={row.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{row.email}</td>
                <td className="px-4 py-3 text-muted">{row.is_super ? 'Super admin' : 'Operador'}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.mfa_enrolled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted'
                    }
                  >
                    {row.mfa_enrolled ? 'Activo' : 'Sin configurar'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {row.is_super ? 'Siempre obligatorio' : row.mfa_required ? 'Obligatorio' : 'Opcional'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailAdmin(row)}
                      className="rounded-lg border border-border px-2 py-1 text-[12px] hover:bg-surface-raised"
                    >
                      Ver detalle
                    </button>
                    {!row.is_super && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void toggleMfaRequired(row)}
                          className="rounded-lg border border-border px-2 py-1 text-[12px] hover:bg-surface-raised"
                        >
                          {row.mfa_required ? 'MFA opcional' : 'MFA obligatorio'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `mfa-${row.id}`}
                          onClick={() => void disableMfa(row)}
                          className="rounded-lg border border-border px-2 py-1 text-[12px] hover:bg-surface-raised"
                        >
                          Desactivar MFA
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `rm-${row.id}`}
                          onClick={() => void removeAccess(row)}
                          className="rounded-lg border border-red-500/40 px-2 py-1 text-[12px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
                        >
                          Quitar acceso
                        </button>
                      </>
                    )}
                    {row.is_super && row.mfa_enrolled && (
                      <button
                        type="button"
                        disabled={busyId === `mfa-${row.id}`}
                        onClick={() => void disableMfa(row)}
                        className="rounded-lg border border-border px-2 py-1 text-[12px] hover:bg-surface-raised"
                      >
                        Desactivar MFA
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-muted">
        Habilitá MFA en Supabase Dashboard → Authentication → Providers si aún no está activo para
        TOTP.
      </p>
    </div>
  )
}
