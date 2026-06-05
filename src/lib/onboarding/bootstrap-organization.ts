import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { CurrencyCode } from '@/types/database'

export interface BootstrapOrgInput {
  name: string
  businessType: string
  currency: CurrencyCode
  usesStock: boolean
}

export type BootstrapOrgResult =
  | { ok: true; organizationId: string }
  | { ok: false; reason: 'not_authenticated' | 'already_has_organization' | 'migration_required' | 'failed'; message: string }

export function describeSupabaseError(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error)
  const e = error as Record<string, unknown>
  const parts = [e.message, e.code, e.details, e.hint].filter(
    (v) => typeof v === 'string' && v.length > 0
  ) as string[]
  if (parts.length > 0) return parts.join(' · ')
  try {
    return JSON.stringify(error)
  } catch {
    return 'Error desconocido'
  }
}

function isRpcMissing(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? '').toLowerCase()
  return (
    error.code === 'PGRST202' ||
    msg.includes('could not find the function') ||
    msg.includes('function public.create_organization_with_owner') ||
    (msg.includes('function') && msg.includes('does not exist'))
  )
}

/** Crea negocio + membresía owner (RPC o fallback con created_by). */
export async function bootstrapOrganization(
  supabase: SupabaseClient,
  user: User,
  input: BootstrapOrgInput
): Promise<BootstrapOrgResult> {
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (existingMember?.organization_id) {
    return { ok: true, organizationId: existingMember.organization_id }
  }

  const { data: rpcOrgId, error: rpcError } = await supabase.rpc(
    'create_organization_with_owner',
    {
      p_name: input.name,
      p_business_type: input.businessType,
      p_currency: input.currency,
      p_uses_stock: input.usesStock,
    }
  )

  if (!rpcError && rpcOrgId) {
    return { ok: true, organizationId: rpcOrgId as string }
  }

  if (rpcError) {
    const msg = describeSupabaseError(rpcError)
    if (msg.includes('already_has_organization')) {
      return { ok: false, reason: 'already_has_organization', message: msg }
    }
    if (msg.includes('not_authenticated')) {
      return { ok: false, reason: 'not_authenticated', message: msg }
    }
    if (!isRpcMissing(rpcError)) {
      return { ok: false, reason: 'failed', message: msg }
    }
  }

  const { data: org, error: insertError } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      business_type: input.businessType,
      currency: input.currency,
      uses_stock: input.usesStock,
      onboarding_completed: false,
      created_by: user.id,
      subscription_owner_id: user.id,
      provisioned_source: 'self_service',
      platform_status: 'trial',
      plan_tier: 'trial',
    })
    .select('id')
    .single()

  if (insertError) {
    const msg = describeSupabaseError(insertError)
    if (
      msg.includes('created_by') ||
      msg.includes('column') ||
      insertError.code === 'PGRST204' ||
      insertError.code === '42703'
    ) {
      return {
        ok: false,
        reason: 'migration_required',
        message: msg,
      }
    }
    if (insertError.code === '42501' || msg.includes('403') || msg.toLowerCase().includes('policy')) {
      return {
        ok: false,
        reason: 'migration_required',
        message: msg || 'RLS: ejecutá la migración de onboarding en Supabase SQL Editor.',
      }
    }
    return { ok: false, reason: 'failed', message: msg }
  }

  if (!org?.id) {
    return { ok: false, reason: 'failed', message: 'No se obtuvo el id del negocio.' }
  }

  const { error: memberError } = await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberError) {
    return { ok: false, reason: 'failed', message: describeSupabaseError(memberError) }
  }

  return { ok: true, organizationId: org.id }
}
