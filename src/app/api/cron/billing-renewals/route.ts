import { NextResponse } from 'next/server'
import { processDueSubscriptionRenewals } from '@/lib/billing/renewals'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!cronSecret || bearer !== cronSecret) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ message: 'Admin no configurado.' }, { status: 500 })
  }

  const results = await processDueSubscriptionRenewals(admin)
  return NextResponse.json({ processed: results.length, results })
}

export async function GET(request: Request) {
  return POST(request)
}
