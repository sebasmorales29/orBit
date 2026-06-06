'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/app/EmptyState'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useAppDialog } from '@/components/ui/app-dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export interface MessageTemplate {
  id: string
  name: string
  content: string
  category: string
}

const CATEGORIES = ['general', 'follow_up', 'order', 'payment'] as const
type TemplateCategory = (typeof CATEGORIES)[number]

function categoryLabel(
  category: string,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  if (CATEGORIES.includes(category as TemplateCategory)) {
    return t(`app.templates.categories.${category}`)
  }
  return t('app.templates.categories.general')
}

interface TemplatesClientProps {
  organizationId: string
  initialTemplates: MessageTemplate[]
}

export function TemplatesClient({ organizationId, initialTemplates }: TemplatesClientProps) {
  const { t } = useTranslations()
  const toast = useToast()
  const dialog = useAppDialog()
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('general')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setName('')
    setContent('')
    setCategory('general')
    setFormOpen(true)
  }

  function openEdit(template: MessageTemplate) {
    setEditing(template)
    setName(template.name)
    setContent(template.content)
    setCategory(
      CATEGORIES.includes(template.category as TemplateCategory)
        ? (template.category as TemplateCategory)
        : 'general'
    )
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function copyText(text: string, id: string) {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('toast.required', { field: t('app.templates.name') }))
      return
    }
    if (!content.trim()) {
      toast.error(t('toast.required', { field: t('app.templates.content') }))
      return
    }

    setLoading(true)
    const supabase = createClient()
    const payload = {
      name: name.trim(),
      content: content.trim(),
      category,
    }

    if (editing) {
      const { data, error: saveError } = await supabase
        .from('message_templates')
        .update(payload)
        .eq('id', editing.id)
        .eq('organization_id', organizationId)
        .select('id, name, content, category')
        .single()

      setLoading(false)
      if (saveError || !data) {
        toast.error(t('app.templates.errorSave'))
        return
      }
      setTemplates((prev) =>
        prev.map((row) => (row.id === editing.id ? (data as MessageTemplate) : row))
      )
      toast.success(t('app.templates.saved'))
    } else {
      const { data, error: saveError } = await supabase
        .from('message_templates')
        .insert({ organization_id: organizationId, ...payload })
        .select('id, name, content, category')
        .single()

      setLoading(false)
      if (saveError || !data) {
        toast.error(t('app.templates.errorSave'))
        return
      }
      setTemplates((prev) =>
        [...prev, data as MessageTemplate].sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success(t('app.templates.saved'))
    }

    closeForm()
    router.refresh()
  }

  async function handleDelete(template: MessageTemplate) {
    const ok = await dialog.confirm({
      title: t('app.templates.delete'),
      message: t('app.templates.deleteConfirm', { name: template.name }),
      confirmText: t('app.templates.delete'),
      tone: 'danger',
    })
    if (!ok) return

    setDeletingId(template.id)
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', template.id)
      .eq('organization_id', organizationId)

    setDeletingId(null)
    if (deleteError) {
      toast.error(t('app.templates.errorDelete'))
      return
    }
    toast.success(t('app.templates.deleted'))
    setTemplates((prev) => prev.filter((row) => row.id !== template.id))
    if (editing?.id === template.id) closeForm()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {!formOpen ? (
        <Button variant="secondary" className="w-full max-w-md lg:max-w-sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('app.templates.new')}
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4"
        >
          <p className="text-[13px] font-medium text-foreground">
            {editing ? t('app.templates.editTitle') : t('app.templates.new')}
          </p>
          <Input
            label={t('app.templates.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label
              htmlFor="template-category"
              className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              {t('app.templates.category')}
            </label>
            <select
              id="template-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TemplateCategory)}
              className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px] text-foreground outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
            >
              {CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {t(`app.templates.categories.${key}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="template-content"
              className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
            >
              {t('app.templates.content')}
            </label>
            <textarea
              id="template-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              className="w-full resize-y rounded-xl border border-border bg-surface-raised px-4 py-3 text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
              placeholder={t('app.templates.contentPlaceholder')}
            />
            <p className="text-[11px] text-muted">{t('app.templates.placeholdersHint')}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={closeForm}>
              {t('app.templates.cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {t('app.templates.save')}
            </Button>
          </div>
        </form>
      )}

      {templates.length === 0 && !formOpen ? (
        <EmptyState
          title={t('app.templates.emptyTitle')}
          description={t('app.templates.emptyHint')}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 sm:gap-3">
          {templates.map((template) => {
            const busy = deletingId === template.id
            return (
              <li
                key={template.id}
                className={cn(
                  'rounded-2xl border border-border bg-surface p-4',
                  busy && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground">{template.name}</p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                      {categoryLabel(template.category, t)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => copyText(template.content, template.id)}
                      className="rounded-full p-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                      aria-label={t('app.templates.copy')}
                    >
                      {copiedId === template.id ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEdit(template)}
                      className="rounded-full p-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground disabled:opacity-40"
                      aria-label={t('app.templates.edit')}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(template)}
                      className="rounded-full p-2 text-muted transition-colors hover:bg-surface-raised hover:text-destructive disabled:opacity-40"
                      aria-label={t('app.templates.delete')}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
                  {template.content}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
