import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { StockClient } from '@/components/stock/StockClient'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import type { Product } from '@/types/database'

export default async function StockPage() {
  const org = await getCurrentOrganization()
  if (org && !org.uses_stock) redirect('/hoy')

  const orgId = org?.id
  const supabase = await createClient()

  let products: Product[] = []
  if (orgId) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgId)
      .order('name')
    products = (data ?? []) as Product[]
  }

  return (
    <>
      <AppHeader title="Stock" subtitle={`${products.length} productos`} />
      <AppMain>
        {orgId ? (
          <StockClient organizationId={orgId} initialProducts={products} />
        ) : (
          <p className="text-muted text-center">Configurá tu negocio primero.</p>
        )}
      </AppMain>
    </>
  )
}
