import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { EmptyState } from '@/components/app/EmptyState'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import { formatMoney } from '@/types/database'

export default async function ClientesPage() {
  const org = await getCurrentOrganization()
  const supabase = await createClient()

  let customers: {
    id: string
    name: string
    phone: string | null
    total_spent: number
    last_order_at: string | null
  }[] = []

  if (org?.id) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', org.id)
      .order('total_spent', { ascending: false })
    customers = data ?? []
  }

  return (
    <>
      <AppHeader title="Clientes" backHref="/mas" />
      <AppMain>
        {customers.length === 0 ? (
          <EmptyState title="Sin clientes" description="Se crean al cerrar leads como ganados." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 sm:gap-3 [&>li]:rounded-2xl [&>li]:border [&>li]:border-border [&>li]:bg-surface sm:[&>li]:divide-none">
            {customers.map((c) => (
              <li key={c.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.phone && <p className="mt-0.5 text-[12px] text-muted">{c.phone}</p>}
                  </div>
                  <p className="text-[13px] font-medium text-foreground">
                    {formatMoney(Number(c.total_spent), org?.currency ?? 'CRC')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppMain>
    </>
  )
}
