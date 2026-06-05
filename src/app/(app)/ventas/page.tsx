import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { EmptyState } from '@/components/app/EmptyState'
import { VentasPageClient } from '@/components/sales/VentasPageClient'
import { NewSaleForm } from '@/components/sales/NewSaleForm'
import { SaleCard } from '@/components/sales/SaleCard'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import type { Order } from '@/types/database'

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const org = await getCurrentOrganization()
  const supabase = await createClient()

  let orders: Order[] = []
  if (org?.id) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
    orders = (data ?? []) as Order[]
  }

  const openOnly = view === 'open'
  const list = openOnly
    ? orders.filter((o) => o.status !== 'cobrado' && o.status !== 'cancelado')
    : orders

  const openCount = orders.filter(
    (o) => o.status !== 'cobrado' && o.status !== 'cancelado'
  ).length

  return (
    <>
      <VentasPageClient openCount={openCount} openOnly={openOnly} />
      <AppMain className="space-y-4 lg:space-y-6">
        {org?.id && <NewSaleForm organizationId={org.id} />}

        {list.length === 0 ? (
          <EmptyState
            title={openOnly ? 'Sin ventas abiertas' : 'Sin ventas'}
            description="Registrá una venta con cliente, artículos, impuestos y forma de pago."
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((order) => (
              <SaleCard key={order.id} order={order} currency={org?.currency ?? 'CRC'} />
            ))}
          </div>
        )}
      </AppMain>
    </>
  )
}
