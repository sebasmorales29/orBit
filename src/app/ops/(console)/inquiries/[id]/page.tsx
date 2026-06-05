import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OpsContactRequestDetail } from '@/components/ops/OpsContactRequestDetail'
import { queryPlatformContactRequest } from '@/lib/platform/contact-requests'

export default async function OpsInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await queryPlatformContactRequest(id)

  if (!result.ok) {
    if (result.message === 'Solicitud no encontrada.') notFound()
    return (
      <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[13px] text-muted">
        {result.message}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <OpsContactRequestDetail request={result.request} />
      {result.request.archived_at && (
        <p className="mt-4 text-center text-[12px] text-muted">
          Archivada el {new Date(result.request.archived_at).toLocaleString('es-CR')}.{' '}
          <Link href="/ops/inquiries?archived=1" className="text-accent underline">
            Ver archivadas
          </Link>
        </p>
      )}
    </div>
  )
}
