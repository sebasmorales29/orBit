'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useTranslations } from '@/components/i18n/LocaleProvider'

interface NewLeadFormProps {
  organizationId: string
}

export function NewLeadForm({ organizationId }: NewLeadFormProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [productInterest, setProductInterest] = useState('')
  const [estimatedAmount, setEstimatedAmount] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('leads').insert({
      organization_id: organizationId,
      name,
      phone: phone || null,
      product_interest: productInterest || null,
      estimated_amount: estimatedAmount ? parseFloat(estimatedAmount) : null,
      status: 'nuevo',
    })

    setLoading(false)
    if (!error) {
      setName('')
      setPhone('')
      setProductInterest('')
      setEstimatedAmount('')
      setOpen(false)
      router.refresh()
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        <Plus className="h-4 w-4" />
        {t('app.consultas.newInquiry')}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-surface-card p-4">
      <p className="text-[13px] font-medium">{t('app.consultas.newInquiry')}</p>
      <Input
        label="Nombre"
        placeholder="María González"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <PhoneInput
        label="Teléfono"
        value={phone}
        onChange={setPhone}
        placeholder="8888-8888"
      />
      <Input
        label="Producto de interés"
        placeholder="Crema hidratante"
        value={productInterest}
        onChange={(e) => setProductInterest(e.target.value)}
      />
      <Input
        label="Monto estimado"
        type="number"
        placeholder="25000"
        value={estimatedAmount}
        onChange={(e) => setEstimatedAmount(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
