import { parseOnboardingProfile } from '@/lib/onboarding/personalization'
import type { Organization, OrderStatus } from '@/types/database'
import type { OrbitConnectOrderPayload } from '@/lib/integrations/types'

export type OrderClassification = {
  orderStatus: OrderStatus
  paid: boolean
  shouldCreatePaymentTask: boolean
  shouldCreatePrepareTask: boolean
  notesSuffix: string
}

/** Ajusta estado del pedido según rubro, perfil y si ya está pagado. */
export function classifyInboundOrder(
  org: Organization,
  payload: OrbitConnectOrderPayload
): OrderClassification {
  const profile = parseOnboardingProfile(org.onboarding_profile ?? null)
  const vertical = profile?.businessTypeKey ?? org.business_type ?? 'other'
  const paid = payload.order.paid === true
  const total = payload.order.total ?? 0

  let orderStatus: OrderStatus = 'confirmado'
  let shouldCreatePrepareTask = false
  let shouldCreatePaymentTask = false

  if (paid) {
    if (vertical === 'food') {
      orderStatus = 'en_preparacion'
      shouldCreatePrepareTask = true
    } else {
      orderStatus = 'confirmado'
    }
  } else if (total > 0) {
    shouldCreatePaymentTask = true
  }

  if (profile?.mainChallenge === 'orders') {
    shouldCreatePrepareTask = paid || shouldCreatePrepareTask
  }

  const source = payload.source ?? 'connect'
  const notesSuffix = ` · orBit Connect (${source})`

  return {
    orderStatus,
    paid,
    shouldCreatePaymentTask,
    shouldCreatePrepareTask,
    notesSuffix,
  }
}
