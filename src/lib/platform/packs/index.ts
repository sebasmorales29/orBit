import foodStockCr from '@/lib/platform/packs/food-stock-cr.json'
import retailCr from '@/lib/platform/packs/retail-cr.json'
import servicesCr from '@/lib/platform/packs/services-cr.json'
import type { TenantPack } from '@/lib/platform/types'

const PACKS: TenantPack[] = [
  retailCr as TenantPack,
  servicesCr as TenantPack,
  foodStockCr as TenantPack,
]

export function listTenantPacks(): TenantPack[] {
  return PACKS
}

export function getTenantPack(id: string): TenantPack | undefined {
  return PACKS.find((p) => p.id === id)
}
