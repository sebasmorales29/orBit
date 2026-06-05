import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { SaleDetail } from '@/components/sales/SaleDetail'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import { formatSaleId } from '@/lib/sales/format'
import type { Order } from '@/types/database'
import type { SaleLineItem } from '@/components/sales/SaleDetail'

export default async function VentaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const org = await getCurrentOrganization()
  if (!org) notFound()

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, product_name, quantity, unit_price')
    .eq('order_id', id)

  const sale = order as Order

  return (
    <>
      <AppHeader
        title={`Venta #${formatSaleId(sale)}`}
        backHref="/ventas"
      />
      <AppMain className="max-w-3xl lg:max-w-none">
        <SaleDetail
          order={sale}
          items={(items ?? []) as SaleLineItem[]}
          currency={org.currency}
        />
      </AppMain>
    </>
  )
}
