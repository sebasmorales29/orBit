'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Plug, Trash2 } from 'lucide-react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useAppDialog } from '@/components/ui/app-dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  createIntegrationConnection,
  revokeIntegrationConnection,
} from '@/lib/integrations/actions'
import type { IntegrationConnectionRow } from '@/lib/integrations/types'

type Props = {
  connections: IntegrationConnectionRow[]
  webhookUrl: string
}

export function IntegracionesPanel({ connections, webhookUrl }: Props) {
  const { t } = useTranslations()
  const dialog = useAppDialog()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const active = connections.filter((c) => c.active)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await createIntegrationConnection(name)
    setLoading(false)
    if (result.ok) {
      setNewSecret(result.secret)
      setName('')
      router.refresh()
    }
  }

  async function handleRevoke(id: string) {
    const ok = await dialog.confirm({
      title: t('app.integrations.revoke'),
      message: t('app.integrations.revokeConfirm'),
      confirmText: t('app.integrations.revoke'),
      tone: 'danger',
    })
    if (!ok) return
    await revokeIntegrationConnection(id)
    router.refresh()
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const exampleJson = `{
  "event": "order.created",
  "id": "pedido-12345",
  "source": "mi_tienda_online",
  "customer": {
    "name": "María López",
    "phone": "+50688887777",
    "email": "maria@ejemplo.com"
  },
  "order": {
    "total": 18500,
    "paid": true,
    "notes": "Entrega mañana AM",
    "items": [
      { "sku": "CAFE-01", "name": "Café 500g", "quantity": 2, "unit_price": 4500 }
    ]
  }
}`

  const curlExample = newSecret
    ? `curl -X POST '${webhookUrl}' \\
  -H 'Authorization: Bearer ${newSecret}' \\
  -H 'Content-Type: application/json' \\
  -d '${exampleJson.replace(/\n/g, ' ')}'`
    : null

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <Plug className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              {t('app.integrations.whatTitle')}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {t('app.integrations.whatBody')}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-surface-raised px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {t('app.integrations.endpoint')}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <code className="break-all text-[12px] text-foreground">{webhookUrl}</code>
            <button
              type="button"
              onClick={() => copyText(webhookUrl, 'url')}
              className="shrink-0 text-muted hover:text-foreground"
              aria-label={t('app.integrations.copy')}
            >
              {copied === 'url' ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </section>

      {newSecret && (
        <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
          <p className="text-[13px] font-semibold text-foreground">
            {t('app.integrations.secretOnce')}
          </p>
          <p className="mt-1 text-[12px] text-muted">{t('app.integrations.secretOnceHint')}</p>
          <code className="mt-3 block break-all rounded-lg bg-surface px-3 py-2 text-[12px]">
            {newSecret}
          </code>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => copyText(newSecret, 'secret')}
            >
              {copied === 'secret' ? t('app.integrations.copied') : t('app.integrations.copy')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNewSecret(null)}>
              {t('app.integrations.dismiss')}
            </Button>
          </div>
          {curlExample && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-surface p-3 text-[10px] leading-relaxed text-muted">
              {curlExample}
            </pre>
          )}
        </section>
      )}

      <section>
        <h3 className="text-[13px] font-medium text-foreground">
          {t('app.integrations.createTitle')}
        </h3>
        <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Input
            label={t('app.integrations.connectionName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('app.integrations.connectionNamePlaceholder')}
            required
          />
          <Button type="submit" loading={loading} className="sm:self-end">
            {t('app.integrations.create')}
          </Button>
        </form>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-foreground">
          {t('app.integrations.activeTitle')}
        </h3>
        {active.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">{t('app.integrations.empty')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {active.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-[14px] font-medium">{c.name}</p>
                  <p className="text-[11px] text-muted">
                    {c.secret_prefix}… · {c.provider}
                    {c.last_used_at
                      ? ` · ${t('app.integrations.lastUsed')}`
                      : ` · ${t('app.integrations.neverUsed')}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(c.id)}
                  className="rounded-lg p-2 text-muted hover:bg-surface-raised hover:text-destructive"
                  aria-label={t('app.integrations.revoke')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface-raised p-4">
        <h3 className="text-[13px] font-medium">{t('app.integrations.exampleTitle')}</h3>
        <p className="mt-1 text-[12px] text-muted">{t('app.integrations.exampleHint')}</p>
        <pre className="mt-3 overflow-x-auto text-[11px] leading-relaxed text-foreground">
          {exampleJson}
        </pre>
      </section>
    </div>
  )
}
