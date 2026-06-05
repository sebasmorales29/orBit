'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/app/EmptyState'
import { useAppOrg } from '@/components/app/AppOrgProvider'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { formatMoney } from '@/types/database'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  stock: number
  stock_minimum: number
  price: number
  unit_cost?: number
}

interface StockClientProps {
  organizationId: string
  initialProducts: Product[]
}

export function StockClient({ organizationId, initialProducts }: StockClientProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const org = useAppOrg()
  const currency = org?.currency ?? 'CRC'
  const [products, setProducts] = useState(initialProducts)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [stock, setStock] = useState('')
  const [stockMin, setStockMin] = useState('5')
  const [price, setPrice] = useState('')
  const [unitCost, setUnitCost] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .insert({
        organization_id: organizationId,
        name,
        stock: parseInt(stock) || 0,
        stock_minimum: parseInt(stockMin) || 5,
        price: parseFloat(price) || 0,
        unit_cost: parseFloat(unitCost) || 0,
      })
      .select()
      .single()

    setLoading(false)
    if (!error && data) {
      setProducts((prev) => [data as Product, ...prev])
      setName('')
      setStock('')
      setPrice('')
      setUnitCost('')
      setOpen(false)
      router.refresh()
    }
  }

  async function adjustStock(product: Product, delta: number) {
    const next = Math.max(0, product.stock + delta)
    setAdjustingId(product.id)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .update({ stock: next })
      .eq('id', product.id)
      .select()
      .single()
    setAdjustingId(null)
    if (!error && data) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? (data as Product) : p)))
      router.refresh()
    }
  }

  const lowCount = products.filter((p) => p.stock <= p.stock_minimum).length

  return (
    <div className="space-y-4">
      {!open ? (
        <Button variant="secondary" className="w-full max-w-md lg:max-w-sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4"
        >
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            <Input label="Mínimo" type="number" value={stockMin} onChange={(e) => setStockMin(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('app.stock.salePrice')} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input
              label={t('app.stock.unitCost')}
              type="number"
              min={0}
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Guardar
            </Button>
          </div>
        </form>
      )}

      {lowCount > 0 && (
        <p className="text-[12px] text-muted">{lowCount} producto(s) bajo mínimo</p>
      )}

      {products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="Agregá lo que vendés para controlar existencias y alertas de reposición."
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 sm:gap-3">
          {products.map((product) => {
            const isLow = product.stock <= product.stock_minimum
            const busy = adjustingId === product.id
            return (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-[12px] text-muted">
                    {formatMoney(product.price, currency)}
                    {(product.unit_cost ?? 0) > 0 && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {t('app.stock.costShort')}{' '}
                        {formatMoney(product.unit_cost ?? 0, currency)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || product.stock <= 0}
                    onClick={() => adjustStock(product, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-hover disabled:opacity-40"
                    aria-label="Reducir stock"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <p
                    className={cn(
                      'min-w-[2ch] text-center text-lg font-semibold tabular-nums',
                      isLow ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    {product.stock}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => adjustStock(product, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-hover disabled:opacity-40"
                    aria-label="Aumentar stock"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
