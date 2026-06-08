import crypto from 'crypto'
import { createTilopayRedirectCheckout, isTilopayConfigured } from '@/lib/billing/tilopay'
import type {
  BillingProviderId,
  CreateCheckoutInput,
  CreateCheckoutResult,
  CreateCheckoutError,
} from '@/lib/billing/types'

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

function billingSecret(): string {
  return (
    process.env.VELUM_BILLING_SECRET ??
    process.env.ORBIT_BILLING_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'velum-dev-billing'
  )
}

export function signCheckoutToken(payload: {
  organizationId: string
  userId: string
  checkoutId: string
  exp: number
}): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', billingSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyCheckoutToken(token: string): {
  organizationId: string
  userId: string
  checkoutId: string
} | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', billingSecret()).update(body).digest('base64url')
  if (sig !== expected) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      organizationId: string
      userId: string
      checkoutId: string
      exp: number
    }
    if (parsed.exp < Date.now()) return null
    return {
      organizationId: parsed.organizationId,
      userId: parsed.userId,
      checkoutId: parsed.checkoutId,
    }
  } catch {
    return null
  }
}

function resolveProvider(): BillingProviderId {
  const forced = (
    process.env.VELUM_BILLING_PROVIDER ?? process.env.ORBIT_BILLING_PROVIDER
  )
    ?.trim()
    .toLowerCase()
  if (forced === 'simulated') return 'simulated'
  if (forced === 'tilopay' && isTilopayConfigured()) return 'tilopay'
  if (forced === 'onvo' && process.env.ONVO_SECRET_KEY?.trim()) return 'onvo'
  if (isTilopayConfigured()) return 'tilopay'
  if (process.env.ONVO_SECRET_KEY?.trim()) return 'onvo'
  return 'simulated'
}

async function createOnvoCheckout(
  input: CreateCheckoutInput,
  checkoutId: string
): Promise<CreateCheckoutResult | CreateCheckoutError> {
  const secret = process.env.ONVO_SECRET_KEY?.trim()
  if (!secret) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'ONVO_SECRET_KEY no configurada.' }
  }

  const amount = input.lineItem.amountCents / 100

  const res = await fetch('https://api.onvopay.com/v1/payment-links', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `Velum — ${input.lineItem.planName}`,
      description: input.lineItem.description,
      currency: 'USD',
      amount,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: {
        organization_id: input.organizationId,
        user_id: input.userId,
        checkout_id: checkoutId,
        plan_id: input.lineItem.planId,
        billing_cycle: input.lineItem.cycle,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      ok: false,
      code: 'PROVIDER_ERROR',
      message: text || `Onvo respondió ${res.status}`,
    }
  }

  const data = (await res.json()) as { url?: string; id?: string; paymentLink?: { url?: string } }
  const checkoutUrl = data.url ?? data.paymentLink?.url
  if (!checkoutUrl) {
    return { ok: false, code: 'PROVIDER_ERROR', message: 'Onvo no devolvió URL de pago.' }
  }

  return {
    ok: true,
    provider: 'onvo',
    checkoutUrl,
    checkoutId: data.id ?? checkoutId,
  }
}

function createSimulatedCheckout(
  input: CreateCheckoutInput,
  checkoutId: string
): CreateCheckoutResult {
  const token = signCheckoutToken({
    organizationId: input.organizationId,
    userId: input.userId,
    checkoutId,
    exp: Date.now() + 30 * 60 * 1000,
  })
  const checkoutUrl = `${appUrl()}/api/billing/confirm?token=${encodeURIComponent(token)}`
  return { ok: true, provider: 'simulated', checkoutUrl, checkoutId }
}

export async function createBillingCheckout(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult | CreateCheckoutError> {
  const checkoutId = `chk_${crypto.randomBytes(12).toString('hex')}`
  const provider = resolveProvider()

  if (provider === 'onvo') {
    const result = await createOnvoCheckout(input, checkoutId)
    if (result.ok) return result
    if (process.env.NODE_ENV === 'development') {
      return createSimulatedCheckout(input, checkoutId)
    }
    return result
  }

  if (provider === 'tilopay') {
    const result = await createTilopayRedirectCheckout(input, checkoutId)
    if (result.ok) {
      return { ok: true, provider: 'tilopay', checkoutUrl: result.checkoutUrl, checkoutId: result.checkoutId }
    }
    if (process.env.NODE_ENV === 'development') {
      return createSimulatedCheckout(input, checkoutId)
    }
    return { ok: false, code: 'PROVIDER_ERROR', message: result.message }
  }

  return createSimulatedCheckout(input, checkoutId)
}

export function recommendedProviderForCostaRica(): BillingProviderId {
  return resolveProvider()
}
