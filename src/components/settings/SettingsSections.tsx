'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export type SettingsSection = {
  id: string
  label: string
  content: React.ReactNode
}

export function SettingsSections({
  sections,
  defaultId,
  queryKey = 'view',
}: {
  sections: SettingsSection[]
  defaultId: string
  queryKey?: string
}) {
  const sp = useSearchParams()
  const router = useRouter()
  const fromQuery = sp.get(queryKey)

  const validIds = useMemo(() => new Set(sections.map((s) => s.id)), [sections])
  const initial = validIds.has(fromQuery ?? '') ? (fromQuery as string) : defaultId

  const [active, setActive] = useState(initial)

  useEffect(() => {
    const next = validIds.has(fromQuery ?? '') ? (fromQuery as string) : defaultId
    setActive(next)
  }, [fromQuery, validIds, defaultId])

  const current = sections.find((s) => s.id === active) ?? sections[0]

  function setView(id: string) {
    setActive(id)
    const url = new URL(window.location.href)
    url.searchParams.set(queryKey, id)
    router.replace(url.pathname + url.search)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-border bg-surface p-2">
        {sections.map((s) => {
          const selected = s.id === active
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setView(s.id)}
              className={cn(
                'w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors',
                selected
                  ? 'bg-surface-raised text-foreground'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          )
        })}
      </aside>

      <div className="min-w-0">{current?.content}</div>
    </div>
  )
}

