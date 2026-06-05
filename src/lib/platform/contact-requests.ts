import { createAdminClient } from '@/lib/supabase/admin'
import { assertPlatformAdmin } from '@/lib/platform/admin'
import { sendEmailResend } from '@/lib/email/resend'

export type ContactRequestStatus = 'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'closed'

export interface ContactRequestRow {
  id: string
  full_name: string
  email: string
  company_name: string | null
  phone: string | null
  role_title: string | null
  team_size: string | null
  interest: string | null
  message: string
  preferred_contact: string
  locale: string
  status: ContactRequestStatus
  source: string
  created_at: string
  updated_at?: string
  archived_at?: string | null
  ops_notes?: string | null
  last_contacted_at?: string | null
}

export interface SubmitContactInput {
  fullName: string
  email: string
  companyName?: string
  phone?: string
  roleTitle?: string
  teamSize?: string
  interest?: string
  message: string
  preferredContact?: string
  locale?: string
}

export type SubmitContactResult =
  | { ok: true; id: string }
  | { ok: false; code: 'INVALID' | 'NOT_CONFIGURED' | 'FAILED'; message: string }

export async function submitPlatformContactRequest(
  input: SubmitContactInput
): Promise<SubmitContactResult> {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const message = input.message.trim()

  if (!fullName || !email.includes('@') || message.length < 10) {
    return {
      ok: false,
      code: 'INVALID',
      message: 'Completá nombre, correo válido y un mensaje de al menos 10 caracteres.',
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'Servicio no disponible.' }
  }

  const { data, error } = await admin
    .from('platform_contact_requests')
    .insert({
      full_name: fullName,
      email,
      company_name: input.companyName?.trim() || null,
      phone: input.phone?.trim() || null,
      role_title: input.roleTitle?.trim() || null,
      team_size: input.teamSize?.trim() || null,
      interest: input.interest?.trim() || null,
      message,
      preferred_contact: input.preferredContact?.trim() || 'email',
      locale: input.locale?.trim() || 'es',
      status: 'new',
      source: 'landing',
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('does not exist')) {
      return {
        ok: false,
        code: 'NOT_CONFIGURED',
        message: 'Ejecutá la migración 20250530270000_platform_contacts_tenant_access.sql en Supabase.',
      }
    }
    return { ok: false, code: 'FAILED', message: error.message }
  }

  return { ok: true, id: data.id }
}

export async function queryPlatformContactRequests(options?: {
  includeArchived?: boolean
}): Promise<{ ok: true; requests: ContactRequestRow[] } | { ok: false; message: string }> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  let query = admin
    .from('platform_contact_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (!options?.includeArchived) {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, requests: (data ?? []) as ContactRequestRow[] }
}

export async function listPlatformContactRequests(options?: {
  includeArchived?: boolean
}): Promise<{ ok: true; requests: ContactRequestRow[] } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }
  return queryPlatformContactRequests(options)
}

export async function queryPlatformContactRequest(
  id: string
): Promise<{ ok: true; request: ContactRequestRow } | { ok: false; message: string }> {
  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { data, error } = await admin
    .from('platform_contact_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return { ok: false, message: error.message }
  if (!data) return { ok: false, message: 'Solicitud no encontrada.' }

  return { ok: true, request: data as ContactRequestRow }
}

export async function getPlatformContactRequest(
  id: string
): Promise<{ ok: true; request: ContactRequestRow } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }
  return queryPlatformContactRequest(id)
}

export async function updateContactRequestStatus(
  id: string,
  status: ContactRequestStatus
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { error } = await admin
    .from('platform_contact_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function updateContactRequestNotes(
  id: string,
  opsNotes: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { error } = await admin
    .from('platform_contact_requests')
    .update({ ops_notes: opsNotes.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function archiveContactRequest(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const now = new Date().toISOString()
  const { error } = await admin
    .from('platform_contact_requests')
    .update({ archived_at: now, updated_at: now })
    .eq('id', id)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function deleteContactRequest(
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }

  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const { error } = await admin.from('platform_contact_requests').delete().eq('id', id)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function sendContactRequestEmail(input: {
  id: string
  subject: string
  body: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) return { ok: false, message: 'Sin permiso.' }

  const detail = await getPlatformContactRequest(input.id)
  if (!detail.ok) return detail

  const subject = input.subject.trim()
  const body = input.body.trim()
  if (!subject || body.length < 5) {
    return { ok: false, message: 'Asunto y mensaje son obligatorios.' }
  }

  const sent = await sendEmailResend({
    to: detail.request.email,
    subject,
    text: body,
  })

  if (!sent.ok) return sent

  const admin = createAdminClient()
  if (!admin) return { ok: false, message: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }

  const now = new Date().toISOString()
  const nextStatus: ContactRequestStatus =
    detail.request.status === 'new' ? 'contacted' : detail.request.status

  const { error } = await admin
    .from('platform_contact_requests')
    .update({
      status: nextStatus,
      last_contacted_at: now,
      updated_at: now,
    })
    .eq('id', input.id)

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}
