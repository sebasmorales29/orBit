'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { OpsSuperAdminConfirmModal } from '@/components/ops/OpsSuperAdminConfirmModal'
import {
  opsDeleteTenantSecure,
  opsStartSuperAdminEmailConfirmV2,
  opsSuspendTenantSecure,
} from '@/lib/platform/actions'

export function OpsTenantRowActions({
  tenant,
}: {
  tenant: {
    id: string
    name: string
    platform_status: 'trial' | 'active' | 'suspended'
  }
}) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState<null | 'suspend' | 'delete'>(null)
  const [loading, setLoading] = useState(false)

  const isSuspended = tenant.platform_status === 'suspended'

  return (
    <div className="flex flex-wrap gap-2">
      <OpsSuperAdminConfirmModal
        open={open === 'suspend'}
        title={`orBit Platform — ${isSuspended ? 'Activar tenant' : 'Desactivar tenant'}`}
        message={
          isSuspended
            ? `Vas a reactivar “${tenant.name}”. Sus usuarios podrán volver a operar si no están desactivados.`
            : `Vas a desactivar “${tenant.name}”. Esto detiene el acceso operativo del tenant hasta que lo activés.`
        }
        confirmText={isSuspended ? 'Activar' : 'Desactivar'}
        tone="warning"
        loading={loading}
        onCancel={() => setOpen(null)}
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
          setLoading(true)
          const result = await opsSuspendTenantSecure({
            orgId: tenant.id,
            suspended: !isSuspended,
            challengeId: emailChallengeId,
            code: emailCode,
          })
          setLoading(false)
          if (!result.ok) {
            toast.error(result.message)
            return
          }
          toast.success(isSuspended ? 'Tenant reactivado' : 'Tenant suspendido')
          setOpen(null)
          router.refresh()
        }}
      />

      <OpsSuperAdminConfirmModal
        open={open === 'delete'}
        title="orBit Platform — Eliminar tenant"
        message={`Vas a eliminar “${tenant.name}” y TODOS sus datos. Además se desactivarán sus usuarios. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        tone="danger"
        loading={loading}
        onCancel={() => setOpen(null)}
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
          setLoading(true)
          const result = await opsDeleteTenantSecure({
            orgId: tenant.id,
            challengeId: emailChallengeId,
            code: emailCode,
          })
          setLoading(false)
          if (!result.ok) {
            toast.error(result.message)
            return
          }
          toast.success('Tenant eliminado')
          setOpen(null)
          router.refresh()
        }}
      />

      <button
        type="button"
        onClick={() => setOpen('suspend')}
        className="rounded-lg border border-border px-2 py-1 text-[12px] text-muted hover:bg-surface-raised hover:text-foreground"
      >
        {isSuspended ? 'Activar' : 'Desactivar'}
      </button>
      <button
        type="button"
        onClick={() => setOpen('delete')}
        className="rounded-lg border border-red-500/40 px-2 py-1 text-[12px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
      >
        Eliminar
      </button>
    </div>
  )
}

