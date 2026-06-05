import { NextResponse } from 'next/server'
import { submitPlatformContactRequest } from '@/lib/platform/contact-requests'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  // Honeypot anti-spam
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ ok: true })
  }

  const result = await submitPlatformContactRequest({
    fullName: String(body.fullName ?? ''),
    email: String(body.email ?? ''),
    companyName: body.companyName ? String(body.companyName) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    roleTitle: body.roleTitle ? String(body.roleTitle) : undefined,
    teamSize: body.teamSize ? String(body.teamSize) : undefined,
    interest: body.interest ? String(body.interest) : undefined,
    message: String(body.message ?? ''),
    preferredContact: body.preferredContact ? String(body.preferredContact) : undefined,
    locale: body.locale ? String(body.locale) : undefined,
  })

  if (!result.ok) {
    const status = result.code === 'INVALID' ? 400 : 503
    return NextResponse.json({ error: result.code, message: result.message }, { status })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
