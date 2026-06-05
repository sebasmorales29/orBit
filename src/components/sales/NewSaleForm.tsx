'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activities'
import { PAYMENT_METHODS, type ShippingAddress } from '@/lib/sales/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useTranslations } from '@/components/i18n/LocaleProvider'

type LineItem = {
  name: string
  quantity: string
  unit_price: string
}

interface NewSaleFormProps {
  organizationId: string
  defaultOpen?: boolean
}

export function NewSaleForm({ organizationId, defaultOpen = false }: NewSaleFormProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(false)

  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [taxAmount, setTaxAmount] = useState('0')
  const [paid, setPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [shipLine1, setShipLine1] = useState('')
  const [shipLine2, setShipLine2] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipProvince, setShipProvince] = useState('')
  const [shipPostal, setShipPostal] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { name: '', quantity: '1', unit_price: '' },
  ])

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', quantity: '1', unit_price: '' }])
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const subtotal = items.reduce((sum, row) => {
    const q = parseFloat(row.quantity) || 0
    const p = parseFloat(row.unit_price) || 0
    return sum + q * p
  }, 0)
  const tax = parseFloat(taxAmount) || 0
  const total = subtotal + tax

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!buyerName.trim()) return
    setLoading(true)

    const shipping: ShippingAddress = {
      line1: shipLine1.trim() || undefined,
      line2: shipLine2.trim() || undefined,
      city: shipCity.trim() || undefined,
      province: shipProvince.trim() || undefined,
      postal_code: shipPostal.trim() || undefined,
    }

    const supabase = createClient()

    let customerId: string | null = null
    const phone = buyerPhone.trim() || null
    if (phone) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone', phone)
        .maybeSingle()
      if (existing?.id) {
        customerId = existing.id
      } else {
        const { data: created } = await supabase
          .from('customers')
          .insert({
            organization_id: organizationId,
            name: buyerName.trim(),
            phone,
            total_spent: total,
            last_order_at: new Date().toISOString(),
          })
          .select('id')
          .single()
        customerId = created?.id ?? null
      }
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        buyer_name: buyerName.trim(),
        buyer_phone: phone,
        subtotal,
        tax_amount: tax,
        total,
        paid,
        payment_method: paymentMethod,
        shipping_address: shipping,
        notes: notes.trim() || null,
        status: paid ? 'cobrado' : 'confirmado',
        external_source: 'manual',
      })
      .select('id, sale_number')
      .single()

    if (!error && order) {
      const validItems = items.filter((r) => r.name.trim())
      if (validItems.length > 0) {
        const { data: catalog } = await supabase
          .from('products')
          .select('name, unit_cost')
          .eq('organization_id', organizationId)

        await supabase.from('order_items').insert(
          validItems.map((row) => {
            const nameLower = row.name.trim().toLowerCase()
            const product = (catalog ?? []).find(
              (p) => p.name.trim().toLowerCase() === nameLower
            )
            return {
              order_id: order.id,
              product_name: row.name.trim(),
              quantity: Math.max(1, parseInt(row.quantity, 10) || 1),
              unit_price: parseFloat(row.unit_price) || 0,
              unit_cost: Number(product?.unit_cost ?? 0),
            }
          })
        )
      }

      await logActivity(supabase, {
        organizationId,
        type: 'sale_created',
        description: `Venta #${order.sale_number ?? '—'} · ${buyerName.trim()}`,
        orderId: order.id,
      })

      resetForm()
      setOpen(false)
      router.push(`/ventas/${order.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  function resetForm() {
    setBuyerName('')
    setBuyerPhone('')
    setPaymentMethod('efectivo')
    setTaxAmount('0')
    setPaid(false)
    setNotes('')
    setShipLine1('')
    setShipLine2('')
    setShipCity('')
    setShipProvince('')
    setShipPostal('')
    setItems([{ name: '', quantity: '1', unit_price: '' }])
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t('app.sales.newSale')}
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-border bg-surface-raised p-4 sm:p-5"
    >
      <p className="text-[14px] font-semibold text-foreground">{t('app.sales.formTitle')}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t('app.sales.buyerName')}
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          required
        />
        <PhoneInput
          label={t('app.sales.buyerPhone')}
          value={buyerPhone}
          onChange={setBuyerPhone}
        />
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">{t('app.sales.itemsTitle')}</p>
        <div className="space-y-2">
          {items.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <div className="col-span-12 sm:col-span-5">
                <Input
                  label={i === 0 ? t('app.sales.itemName') : undefined}
                  value={row.name}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                  placeholder={t('app.sales.itemNamePlaceholder')}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  label={i === 0 ? t('app.sales.quantity') : undefined}
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateItem(i, { quantity: e.target.value })}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Input
                  label={i === 0 ? t('app.sales.unitPrice') : undefined}
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.unit_price}
                  onChange={(e) => updateItem(i, { unit_price: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-end pb-1">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-destructive"
                  aria-label={t('app.sales.removeItem')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" className="mt-2" onClick={addItem}>
          <Plus className="h-4 w-4" />
          {t('app.sales.addItem')}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted">{t('app.sales.subtotal')}</p>
          <p className="text-[15px] font-semibold">{subtotal.toLocaleString('es-CR')}</p>
        </div>
        <Input
          label={t('app.sales.taxes')}
          type="number"
          min={0}
          step="0.01"
          value={taxAmount}
          onChange={(e) => setTaxAmount(e.target.value)}
        />
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted">{t('app.sales.total')}</p>
          <p className="text-[15px] font-semibold text-foreground">{total.toLocaleString('es-CR')}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-muted">
            {t('app.sales.paymentMethod')}
          </span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {t(m.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-[13px] text-foreground">{t('app.sales.alreadyPaid')}</span>
        </label>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-muted">{t('app.sales.shippingTitle')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('app.sales.addressLine1')}
            value={shipLine1}
            onChange={(e) => setShipLine1(e.target.value)}
          />
          <Input
            label={t('app.sales.addressLine2')}
            value={shipLine2}
            onChange={(e) => setShipLine2(e.target.value)}
          />
          <Input label={t('app.sales.city')} value={shipCity} onChange={(e) => setShipCity(e.target.value)} />
          <Input
            label={t('app.sales.province')}
            value={shipProvince}
            onChange={(e) => setShipProvince(e.target.value)}
          />
          <Input
            label={t('app.sales.postalCode')}
            value={shipPostal}
            onChange={(e) => setShipPostal(e.target.value)}
          />
        </div>
      </div>

      <Input label={t('app.sales.notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
          {t('app.sales.cancel')}
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          {t('app.sales.save')}
        </Button>
      </div>
    </form>
  )
}
