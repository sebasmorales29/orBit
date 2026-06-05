'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activities'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface NewOrderFormProps {
  organizationId: string
  leadId?: string
  customerId?: string
  defaultTotal?: number
  /** Si true, muestra el formulario abierto (p. ej. desde detalle de lead). */
  defaultOpen?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function NewOrderForm({
  organizationId,
  leadId,
  customerId,
  defaultTotal,
  defaultOpen = false,
  onSuccess,
  onCancel,
}: NewOrderFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(defaultTotal != null ? String(defaultTotal) : '')
  const [notes, setNotes] = useState('')

  const isInline = defaultOpen || Boolean(onCancel)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        organization_id: organizationId,
        total: parseFloat(total) || 0,
        notes: notes || null,
        status: 'confirmado',
        lead_id: leadId ?? null,
        customer_id: customerId ?? null,
      })
      .select('id')
      .single()

    if (!error && order) {
      await logActivity(supabase, {
        organizationId,
        type: 'order_created',
        description: `Pedido creado · ${parseFloat(total) || 0}`,
        leadId: leadId ?? undefined,
        orderId: order.id,
      })
      setTotal('')
      setNotes('')
      setOpen(false)
      onSuccess?.()
      router.refresh()
    }
    setLoading(false)
  }

  function handleCancel() {
    setOpen(false)
    onCancel?.()
  }

  if (!open && !isInline) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo pedido
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4"
    >
      <p className="text-[13px] font-medium">{leadId ? 'Pedido para este lead' : 'Nuevo pedido'}</p>
      <Input
        label="Total"
        type="number"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        required
      />
      <Input label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
