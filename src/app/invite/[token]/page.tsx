import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite, getInviteWelcome } from '@/lib/platform/invites'
import { InviteLoginForm } from '@/components/invite/InviteLoginForm'

export const dynamic = 'force-dynamic'

export default async function InviteAcceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { token } = await params
  const sp = await searchParams
  const next = sp.next ?? '/hoy'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !user.id) {
    const welcome = await getInviteWelcome(token)
    if (!welcome.ok) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-16">
          <div className="w-full space-y-2 rounded-2xl border border-border bg-surface p-6">
            <h1 className="text-xl font-semibold text-foreground">Invitación</h1>
            <p className="text-[14px] text-muted">{welcome.message}</p>
          </div>
        </div>
      )
    }

    const inv = welcome.invite
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-16">
        <div className="w-full rounded-3xl border border-border bg-surface p-6 shadow-2xl">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Velum · Invitación
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Bienvenido a {inv.organization.name}
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            {inv.invited_by_name || inv.invited_by_email ? (
              <>
                Invitado por{' '}
                <span className="text-foreground">
                  {inv.invited_by_name ?? inv.invited_by_email}
                </span>
                .
              </>
            ) : (
              'Tenés una invitación pendiente.'
            )}
          </p>
          <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-[13px] text-muted">
            Iniciá sesión para aceptar la invitación. Solo necesitás tu usuario y contraseña.
          </div>
          <InviteLoginForm email={inv.email} token={token} />
        </div>
      </div>
    )
  }

  if ((user.user_metadata as Record<string, unknown> | undefined)?.must_change_password) {
    redirect(`/change-password?next=${encodeURIComponent(`/invite/${token}`)}`)
  }

  const result = await acceptInvite(token, { userId: user.id, email: user.email })
  if (!result.ok) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-16">
        <div className="w-full space-y-2 rounded-2xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold text-foreground">Invitación</h1>
          <p className="text-[14px] text-muted">{result.message}</p>
        </div>
      </div>
    )
  }

  redirect(next)
}

