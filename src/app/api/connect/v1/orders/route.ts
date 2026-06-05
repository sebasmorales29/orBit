import { NextResponse } from 'next/server'
import {
  extractBearerToken,
  resolveConnectionBySecret,
} from '@/lib/integrations/auth-connection'
import { processInboundOrder } from '@/lib/integrations/process-order'
import { validateOrderPayload } from '@/lib/integrations/validate-payload'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Organization } from '@/types/database'

export const runtime = 'nodejs'

async function logEvent(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  params: {
    organizationId: string
    connectionId: string | null
    eventType: string
    status: 'success' | 'error' | 'duplicate'
    externalId?: string
    payload: Record<string, unknown>
    result?: Record<string, unknown>
    errorMessage?: string
  }
) {
  await supabase.from('integration_events').insert({
    organization_id: params.organizationId,
    connection_id: params.connectionId,
    direction: 'inbound',
    event_type: params.eventType,
    status: params.status,
    external_id: params.externalId ?? null,
    payload: params.payload,
    result: params.result ?? {},
    error_message: params.errorMessage ?? null,
  })
}

export async function POST(request: Request) {
  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'CONNECT_NOT_CONFIGURED', message: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 503 }
    )
  }

  const secret = extractBearerToken(request.headers.get('authorization'))
  if (!secret) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Usá Authorization: Bearer <tu_clave_orbit>' },
      { status: 401 }
    )
  }

  const connection = await resolveConnectionBySecret(supabase, secret)
  if (!connection) {
    return NextResponse.json({ error: 'INVALID_KEY' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const validated = validateOrderPayload(body)
  if (!validated.ok) {
    await logEvent(supabase, {
      organizationId: connection.organization_id,
      connectionId: connection.id,
      eventType: 'order.created',
      status: 'error',
      payload: typeof body === 'object' && body ? (body as Record<string, unknown>) : {},
      errorMessage: validated.error,
    })
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', connection.organization_id)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'ORG_NOT_FOUND' }, { status: 404 })
  }

  try {
    const result = await processInboundOrder(
      supabase,
      connection,
      org as Organization,
      validated.payload
    )

    await logEvent(supabase, {
      organizationId: connection.organization_id,
      connectionId: connection.id,
      eventType: validated.payload.event ?? 'order.created',
      status: result.duplicate ? 'duplicate' : 'success',
      externalId: validated.payload.id,
      payload: validated.payload as unknown as Record<string, unknown>,
      result: {
        orderId: result.orderId,
        customerId: result.customerId,
        classification: result.classification,
      },
    })

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate ?? false,
      order_id: result.orderId,
      customer_id: result.customerId,
      classification: result.classification,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'PROCESS_FAILED'
    await logEvent(supabase, {
      organizationId: connection.organization_id,
      connectionId: connection.id,
      eventType: 'order.created',
      status: 'error',
      externalId: validated.payload.id,
      payload: validated.payload as unknown as Record<string, unknown>,
      errorMessage: message,
    })
    return NextResponse.json({ error: 'PROCESS_FAILED', message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'orBit Connect',
    version: 1,
    endpoint: 'POST /api/connect/v1/orders',
    auth: 'Authorization: Bearer <webhook_secret>',
    docs: 'https://orbit.app/docs/connect',
  })
}
