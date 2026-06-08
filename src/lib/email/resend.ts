import { readBrandEnv } from '@/lib/brand-env'

type SendEmailResult = { ok: true } | { ok: false; message: string }

export async function sendEmailResend(input: {
  to: string
  subject: string
  text: string
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = readBrandEnv('PLATFORM_EMAIL_FROM')

  if (!apiKey) {
    return { ok: false, message: 'Falta RESEND_API_KEY en el servidor.' }
  }
  if (!from) {
    return { ok: false, message: 'Falta VELUM_PLATFORM_EMAIL_FROM en el servidor.' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, message: `Error enviando correo: ${res.status} ${body}`.slice(0, 400) }
  }

  return { ok: true }
}

