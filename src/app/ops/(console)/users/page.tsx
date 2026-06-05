import Link from 'next/link'
import { AccountStatusDot } from '@/components/ui/AccountStatusDot'
import { listPlatformUsers } from '@/lib/platform/users-admin'

export default async function OpsUsersPage() {
  const result = await listPlatformUsers()

  if (!result.ok) {
    return <p className="text-[14px] text-red-600">{result.message}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
        <p className="mt-1 text-[14px] text-muted">
          Cuentas de auth en Supabase y su tenant asociado.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-raised text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Estado</span>
              </th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Rol</th>
            </tr>
          </thead>
          <tbody>
            {result.users.map((u) => (
              <tr key={u.id} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-3">
                  <AccountStatusDot
                    status={u.is_suspended ? 'suspended' : 'active'}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ops/users/${u.id}`} className="text-foreground hover:underline">
                    {u.email ?? u.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{u.full_name ?? '—'}</td>
                <td className="px-4 py-3">
                  {u.organization_id ? (
                    <Link
                      href={`/ops/tenants/${u.organization_id}`}
                      className="text-accent hover:underline"
                    >
                      {u.organization_name}
                    </Link>
                  ) : (
                    <span className="text-muted">Sin tenant</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{u.member_role ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
