import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { resolveAuthNextPath } from '@/lib/auth/safe-next-path'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const nextParam = searchParams.get('next')

  const supabase = await createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })
    if (!error) {
      const next = resolveAuthNextPath(nextParam, type)
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const next = resolveAuthNextPath(nextParam, type)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
