'use client'

import { useState } from 'react'
import Link from 'next/link'
import { opsProvisionTenant } from '@/lib/platform/actions'
import type { TenantPack } from '@/lib/platform/types'
import type { CurrencyCode } from '@/types/database'
import { slugifyTenantName } from '@/lib/platform/tenant-slug'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/toast'

interface OpsCreateTenantFormProps {
  packs: TenantPack[]
}

export function OpsCreateTenantForm({ packs }: OpsCreateTenantFormProps) {
  const toast = useToast()
  const [packId, setPackId] = useState(packs[0]?.id ?? '')
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('CRC')
  const [usesStock, setUsesStock] = useState<boolean | null>(null)
  const [slug, setSlug] = useState('')
  const [maxMembers, setMaxMembers] = useState('')
  const [allowedDomains, setAllowedDomains] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [publishUrl, setPublishUrl] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedPack = packs.find((p) => p.id === packId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const domains = allowedDomains
      .split(/[\s,;]+/)
      .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean)

    const result = await opsProvisionTenant({
      packId,
      businessName,
      ownerName,
      ownerEmail,
      currency,
      ...(usesStock !== null ? { usesStock } : {}),
      slug: slug.trim() || slugifyTenantName(businessName),
      maxMembers: maxMembers.trim() ? parseInt(maxMembers, 10) : null,
      allowedEmailDomains: domains,
      isDemo,
      publicUrlPublished: publishUrl,
    })

    setLoading(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    toast.success(
      result.invited
        ? `Tenant creado. Se envió invitación a ${ownerEmail}.`
        : `Tenant creado. El owner ya tiene cuenta y puede entrar a /hoy.`
    )
    setBusinessName('')
    setOwnerName('')
    setOwnerEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      <div>
        <label
          htmlFor="pack"
          className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
        >
          Pack de tenant
        </label>
        <select
          id="pack"
          value={packId}
          onChange={(e) => {
            setPackId(e.target.value)
            const pack = packs.find((p) => p.id === e.target.value)
            if (pack) {
              setCurrency(pack.defaults.currency)
              setUsesStock(null)
            }
          }}
          className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
        >
          {packs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {selectedPack && (
          <p className="mt-2 text-[12px] leading-relaxed text-muted">{selectedPack.description}</p>
        )}
      </div>

      <Input
        label="Nombre del negocio"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        required
        placeholder="Ej. NORbit"
      />

      <Input
        label="Nombre del contacto (owner)"
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
        required
        placeholder="Ej. María"
      />

      <Input
        label="Correo del owner"
        type="email"
        value={ownerEmail}
        onChange={(e) => setOwnerEmail(e.target.value)}
        required
        placeholder="dueño@empresa.com"
      />

      <div className="rounded-xl border border-border-subtle bg-surface-raised/50 p-4 space-y-4">
        <p className="text-[13px] font-medium text-foreground">Acceso y URL pública</p>
        <Input
          label="Slug (URL /t/…)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={businessName ? slugifyTenantName(businessName) : 'mi-negocio'}
        />
        <p className="text-[12px] text-muted">Solo minúsculas, números y guiones. Podés publicar la URL después.</p>
        <Input
          label="Límite de usuarios"
          type="number"
          min={1}
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)}
          placeholder="Vacío = sin límite"
        />
        <Input
          label="Dominios de correo permitidos"
          value={allowedDomains}
          onChange={(e) => setAllowedDomains(e.target.value)}
          placeholder="empresa.com, otra.co (vacío = cualquiera)"
        />
        <label className="flex items-center gap-2 text-[14px] text-foreground">
          <input type="checkbox" checked={isDemo} onChange={(e) => setIsDemo(e.target.checked)} />
          Tenant de demostración
        </label>
        <label className="flex items-center gap-2 text-[14px] text-foreground">
          <input
            type="checkbox"
            checked={publishUrl}
            onChange={(e) => setPublishUrl(e.target.checked)}
          />
          Publicar URL de acceso al crear (requiere slug)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="currency"
            className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            Moneda
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px]"
          >
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="stock"
            className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
          >
            Inventario
          </label>
          <select
            id="stock"
            value={usesStock === null ? 'pack' : usesStock ? 'on' : 'off'}
            onChange={(e) => {
              const v = e.target.value
              setUsesStock(v === 'pack' ? null : v === 'on')
            }}
            className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px]"
          >
            <option value="pack">
              Según pack ({selectedPack?.defaults.usesStock ? 'sí' : 'no'})
            </option>
            <option value="on">Activo</option>
            <option value="off">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Link href="/ops/tenants" className="flex-1">
          <Button type="button" variant="ghost" className="w-full">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" className="flex-1" loading={loading}>
          Crear y entregar
        </Button>
      </div>
    </form>
  )
}
