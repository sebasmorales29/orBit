import { redirect } from 'next/navigation'

/** Login de Ops unificado con el sitio público. */
export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = typeof params.next === 'string' && params.next.startsWith('/ops') ? params.next : '/ops'
  redirect(`/login?next=${encodeURIComponent(next)}`)
}
