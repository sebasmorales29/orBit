import crypto from 'crypto'
import type { CreateCheckoutInput } from '@/lib/billing/types'

const TPAY_API_BASE = 'https://app.tilopay.com/api/v1'

export interface TilopayCredentials {
  key: string
  user: string
  password: string
}

export function getTilopayCredentials(): TilopayCredentials | null {
  const key = process.env.TILOPAY_API_KEY?.trim()
  const user = process.env.TILOPAY_API_USER?.trim()
  const password = process.env.TILOPAY_API_PASSWORD?.trim()
  if (!key || !user || !password) return null
  return { key, user, password }
}

export function isTilopayConfigured(): boolean {
  return getTilopayCredentials() !== null
}

function formatTilopayAmount(amount: number): string {
  return amount.toFixed(2)
}

export function computeTilopayOrderHash(input: {
  creds: TilopayCredentials
  orderNumber: string
  amount: number
  currency: string
  tpayOrderId: string
  responseCode: string | number
  auth: string
  email: string
}): string {
  const hashKey = `${input.tpayOrderId}|${input.creds.key}|${input.creds.password}`
  const pairs: [string, string][] = [
    ['api_Key', input.creds.key],
    ['api_user', input.creds.user],
    ['orderId', input.tpayOrderId],
    ['external_orden_id', input.orderNumber],
    ['amount', formatTilopayAmount(input.amount)],
    ['currency', input.currency],
    ['responseCode', String(input.responseCode)],
    ['auth', input.auth],
    ['email', input.email],
  ]

  const query = pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  return crypto.createHmac('sha256', hashKey).update(query).digest('hex')
}

export function verifyTilopayOrderHash(input: {
  creds: TilopayCredentials
  orderNumber: string
  amount: number
  currency: string
  tpayOrderId: string
  responseCode: string | number
  auth: string
  email: string
  orderHash: string
}): boolean {
  if (!input.orderHash || input.orderHash.length !== 64) return false
  if (!input.auth || input.auth.length < 6) return false

  const expected = computeTilopayOrderHash(input)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.orderHash))
  } catch {
    return false
  }
}

async function tilopayLogin(creds: TilopayCredentials): Promise<string> {
  const res = await fetch(`${TPAY_API_BASE}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: creds.user,
      password: creds.password,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as { access_token?: string; message?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(data.message ?? `Tilopay login respondió ${res.status}`)
  }
  return data.access_token
}

export interface TilopayRedirectResult {
  ok: true
  checkoutUrl: string
  checkoutId: string
}

export interface TilopayRedirectError {
  ok: false
  message: string
}

export async function createTilopayRedirectCheckout(
  input: CreateCheckoutInput,
  checkoutId: string
): Promise<TilopayRedirectResult | TilopayRedirectError> {
  const creds = getTilopayCredentials()
  if (!creds) {
    return { ok: false, message: 'Credenciales Tilopay incompletas (API key, user, password).' }
  }

  let accessToken: string
  try {
    accessToken = await tilopayLogin(creds)
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'No se pudo autenticar con Tilopay.',
    }
  }

  const amount = input.lineItem.amountCents / 100
  const nameParts = input.businessName.trim().split(/\s+/)
  const firstName = nameParts[0] ?? 'Cliente'
  const lastName = nameParts.slice(1).join(' ') || 'orBit'

  const payload = {
    redirect: input.successUrl,
    key: creds.key,
    amount,
    currency: input.lineItem.currency,
    billToFirstName: firstName,
    billToLastName: lastName,
    billToCountry: 'CR',
    billToEmail: input.userEmail,
    orderNumber: checkoutId,
    capture: 1,
    subscription: 1,
    platform: 'orbit-saas',
    lang: 'es',
    hashVersion: 'V2',
    returnData: 'orbit',
  }

  const res = await fetch(`${TPAY_API_BASE}/processPayment`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = (await res.json().catch(() => ({}))) as {
    type?: number
    url?: string
    message?: string
  }

  if (!res.ok) {
    return {
      ok: false,
      message: result.message ?? `Tilopay processPayment respondió ${res.status}`,
    }
  }

  if (result.type === 100 && result.url) {
    return { ok: true, checkoutUrl: result.url, checkoutId }
  }

  return {
    ok: false,
    message:
      result.message ??
      `Tilopay no devolvió URL de pago (type=${String(result.type ?? 'unknown')}).`,
  }
}

export interface TilopayReturnParams {
  code: string | null
  orderNumber: string | null
  orderHash: string | null
  tpayOrderId: string | null
  auth: string | null
  cardToken: string | null
  canceled: boolean
}

export interface TilopayRecurrentResult {
  ok: true
  auth: string
  orderId?: string
}

export interface TilopayRecurrentError {
  ok: false
  message: string
}

export async function processTilopayRecurrentPayment(input: {
  cardToken: string
  amount: number
  currency: string
  email: string
  orderNumber: string
}): Promise<TilopayRecurrentResult | TilopayRecurrentError> {
  const creds = getTilopayCredentials()
  if (!creds) {
    return { ok: false, message: 'Tilopay no configurado.' }
  }

  let accessToken: string
  try {
    accessToken = await tilopayLogin(creds)
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Error de login Tilopay.',
    }
  }

  const payload = {
    key: creds.key,
    card: input.cardToken,
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    orderNumber: input.orderNumber,
    capture: 1,
    hashVersion: 'V2',
    callFrom: 'orbit-saas-renewal',
    language: 'es',
  }

  const res = await fetch(`${TPAY_API_BASE}/processRecurrentPayment`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = (await res.json().catch(() => ({}))) as {
    type?: string | number
    response?: string | number
    description?: string
    auth?: string
    order_id?: string
    message?: string
  }

  if (!res.ok) {
    return {
      ok: false,
      message: result.description ?? result.message ?? `Tilopay recurrent ${res.status}`,
    }
  }

  if (String(result.type) === '200' && Number(result.response) === 1 && result.auth) {
    return { ok: true, auth: result.auth, orderId: result.order_id }
  }

  return {
    ok: false,
    message: result.description ?? result.message ?? 'Cobro recurrente rechazado.',
  }
}

export function parseTilopayReturnParams(searchParams: URLSearchParams): TilopayReturnParams {
  return {
    code: searchParams.get('code'),
    orderNumber: searchParams.get('order'),
    orderHash: searchParams.get('OrderHash'),
    tpayOrderId: searchParams.get('tpt'),
    auth: searchParams.get('auth'),
    cardToken: searchParams.get('crd'),
    canceled: searchParams.get('wp_cancel') === 'yes',
  }
}
