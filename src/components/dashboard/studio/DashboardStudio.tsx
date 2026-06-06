'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  GripVertical,
  Layers,
  LayoutGrid,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { HoyDashboard } from '@/components/hoy/HoyDashboard'
import type { HoyDashboardData } from '@/lib/dashboard/hoy-data'
import { DASHBOARD_WIDGET_META } from '@/lib/dashboard/widget-meta'
import {
  addCell,
  addRow,
  addSection,
  getPlacedWidgetIds,
  moveRow,
  moveSection,
  removeCell,
  removeRow,
  removeSection,
  updateCell,
  updateSection,
  type StudioSelection,
} from '@/lib/dashboard/layout-v2'
import type { DashboardVisibility } from '@/lib/dashboard/tenant-dashboards'
import type { DashboardLayoutV2, DashboardWidgetId, GridSpan } from '@/lib/dashboard/types'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useAppDialog } from '@/components/ui/app-dialog'
import { cn } from '@/lib/utils'
import {
  buildExportBundle,
  downloadExportBundle,
  parseImportBundle,
  readJsonFile,
} from '@/lib/dashboard/export'

const DND_WIDGET = 'application/x-orbit-widget'
const DND_CELL = 'application/x-orbit-cell'

const STUDIO_BG = 'bg-[#0a0e14]'
const PANEL = 'border-[#2a3f5f] bg-[#111820]'
const ACCENT = 'text-[#00d4aa]'
const ACCENT_BORDER = 'border-[#00d4aa]/50'

type StudioViewMode = 'split' | 'design' | 'preview'

interface DashboardStudioProps {
  open: boolean
  layout: DashboardLayoutV2
  data: HoyDashboardData
  usesStock: boolean
  dashboardName: string
  onDashboardNameChange: (name: string) => void
  visibility: DashboardVisibility
  onVisibilityChange: (v: DashboardVisibility) => void
  canEditSharing: boolean
  exportName: string
  onExportNameChange: (name: string) => void
  onClose: () => void
  onChange: (layout: DashboardLayoutV2) => void
  onReset: () => void
  onSave: () => void
  saving: boolean
}

export function DashboardStudio({
  open,
  layout,
  data,
  usesStock,
  dashboardName,
  onDashboardNameChange,
  visibility,
  onVisibilityChange,
  canEditSharing,
  exportName,
  onExportNameChange,
  onClose,
  onChange,
  onReset,
  onSave,
  saving,
}: DashboardStudioProps) {
  const { t } = useTranslations()
  const dialog = useAppDialog()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selection, setSelection] = useState<StudioSelection>(null)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [viewMode, setViewMode] = useState<StudioViewMode>('split')

  const placed = useMemo(() => getPlacedWidgetIds(layout), [layout])

  const paletteWidgets = useMemo(() => {
    return DASHBOARD_WIDGET_META.filter((m) => {
      if (m.requiresStock && !usesStock) return false
      if (placed.has(m.id)) return false
      if (paletteQuery.trim()) {
        const q = paletteQuery.toLowerCase()
        const label = t(m.labelKey).toLowerCase()
        return label.includes(q) || m.id.includes(q)
      }
      return true
    })
  }, [usesStock, placed, paletteQuery, t])

  const categories = useMemo(() => {
    const map = new Map<string, typeof DASHBOARD_WIDGET_META>()
    for (const m of paletteWidgets) {
      const cat = t(m.categoryKey)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(m)
    }
    return [...map.entries()]
  }, [paletteWidgets, t])

  const handleDropOnRow = useCallback(
    (sectionId: string, rowId: string, e: React.DragEvent) => {
      e.preventDefault()
      const widgetId = e.dataTransfer.getData(DND_WIDGET) as DashboardWidgetId
      if (!widgetId) return
      const next = addCell(layout, sectionId, rowId, widgetId)
      if (next) onChange(next)
    },
    [layout, onChange]
  )

  if (!open) return null

  const selectedCell =
    selection?.kind === 'cell'
      ? layout.sections
          .find((s) => s.id === selection.sectionId)
          ?.rows.find((r) => r.id === selection.rowId)
          ?.cells.find((c) => c.id === selection.cellId)
      : null

  const selectedSection =
    selection?.kind === 'section'
      ? layout.sections.find((s) => s.id === selection.sectionId)
      : null

  return (
    <div className={cn('fixed inset-0 z-[80] flex flex-col', STUDIO_BG)}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#243044] bg-[#0f141c] px-4 py-3">
        <div className="flex items-center gap-3">
          <Layers className={cn('h-5 w-5', ACCENT)} />
          <div>
            <h1 className="font-mono text-[13px] font-bold uppercase tracking-[0.12em] text-[#e8f1f8]">
              {t('app.dashboard.studio.title')}
            </h1>
            <p className="text-[11px] text-[#6d8aa8]">{t('app.dashboard.studio.subtitle')}</p>
            <p className="mt-0.5 text-[10px] text-[#4a7a9a]">
              {t('app.dashboard.studio.personalLayout')}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-1 rounded border border-[#2a3f5f] bg-[#0a0e14] p-0.5 sm:flex">
          {(
            [
              { id: 'split' as const, icon: LayoutGrid, label: t('app.dashboard.studio.modeSplit') },
              { id: 'design' as const, icon: Layers, label: t('app.dashboard.studio.modeDesign') },
              { id: 'preview' as const, icon: Eye, label: t('app.dashboard.studio.modePreview') },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide',
                viewMode === id
                  ? 'bg-[#00d4aa] text-[#041018]'
                  : 'text-[#8eb4d4] hover:bg-[#151d2a]'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(addSection(layout, t('app.dashboard.studio.newSection')))}
            className="inline-flex items-center gap-1.5 rounded border border-[#2a3f5f] bg-[#151d2a] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-[#c5d9eb] hover:border-[#00d4aa]/40"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('app.dashboard.studio.addSection')}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded border border-[#2a3f5f] px-3 py-1.5 text-[12px] text-[#8eb4d4] hover:bg-[#151d2a]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('app.dashboard.reset')}
          </button>
          <button
            type="button"
            onClick={() => downloadExportBundle(buildExportBundle(layout, exportName, undefined, usesStock))}
            className="inline-flex items-center gap-1.5 rounded border border-[#2a3f5f] px-3 py-1.5 text-[12px] text-[#8eb4d4] hover:bg-[#151d2a]"
          >
            <Download className="h-3.5 w-3.5" />
            {t('app.dashboard.export')}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded border border-[#2a3f5f] px-3 py-1.5 text-[12px] text-[#8eb4d4] hover:bg-[#151d2a]"
          >
            <Upload className="h-3.5 w-3.5" />
            {t('app.dashboard.import')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const raw = await readJsonFile(file)
                const result = parseImportBundle(raw, usesStock)
                if (!result.ok) {
                  await dialog.alert({
                    title: t('app.dashboard.import'),
                    message: t(`app.dashboard.importErrors.${result.error}`),
                    tone: 'danger',
                  })
                  return
                }
                onChange(result.layout)
                if (result.name) onExportNameChange(result.name)
              } catch {
                await dialog.alert({
                  title: t('app.dashboard.import'),
                  message: t('app.dashboard.importErrors.invalid_json'),
                  tone: 'danger',
                })
              }
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#2a3f5f] px-3 py-1.5 text-[12px] text-[#8eb4d4]"
          >
            {t('app.dashboard.close')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide',
              'bg-[#00d4aa] text-[#041018] hover:bg-[#33e0be] disabled:opacity-50'
            )}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? '…' : t('app.dashboard.save')}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Paleta XSOAR */}
        {viewMode !== 'preview' && (
        <aside
          className={cn(
            'flex w-[260px] shrink-0 flex-col border-r',
            PANEL,
            'border-r-[#243044]'
          )}
        >
          <div className="border-b border-[#243044] px-3 py-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d8aa8]">
              {t('app.dashboard.studio.palette')}
            </p>
            <input
              type="search"
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              placeholder={t('app.dashboard.studio.search')}
              className="mt-2 w-full rounded border border-[#2a3f5f] bg-[#0a0e14] px-2.5 py-1.5 font-mono text-[12px] text-[#c5d9eb] placeholder:text-[#4a6278] outline-none focus:border-[#00d4aa]/50"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {categories.length === 0 ? (
              <p className="px-2 py-4 text-[12px] text-[#6d8aa8]">
                {t('app.dashboard.studio.allPlaced')}
              </p>
            ) : (
              categories.map(([cat, items]) => (
                <div key={cat} className="mb-4">
                  <p className="mb-1.5 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#4a7a9a]">
                    {cat}
                  </p>
                  <ul className="space-y-1">
                    {items.map((m) => (
                      <li key={m.id}>
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(DND_WIDGET, m.id)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                          className="cursor-grab rounded border border-[#2a3f5f] bg-[#0f151d] px-2.5 py-2 active:cursor-grabbing hover:border-[#00d4aa]/40"
                        >
                          <p className="text-[12px] font-medium text-[#dce8f2]">{t(m.labelKey)}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-[#5a7a94]">{m.id}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </aside>
        )}

        {/* Canvas + vista previa en vivo */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            viewMode === 'split' && 'lg:flex-row'
          )}
        >
        <main
          className={cn(
            'min-w-0 overflow-y-auto p-4',
            viewMode === 'preview' && 'hidden',
            viewMode === 'split' && 'lg:w-1/2 lg:border-r lg:border-[#243044]',
            viewMode === 'design' && 'flex-1'
          )}
        >
          {layout.sections.length === 0 ? (
            <p className="text-center text-[14px] text-[#6d8aa8]">
              {t('app.dashboard.studio.emptyCanvas')}
            </p>
          ) : (
            <div className="mx-auto max-w-5xl space-y-4">
              {layout.sections.map((sec, secIdx) => (
                <div
                  key={sec.id}
                  className={cn(
                    'overflow-hidden rounded-lg border',
                    selection?.sectionId === sec.id && selection.kind === 'section'
                      ? ACCENT_BORDER
                      : 'border-[#243044]',
                    'bg-[#0c1018]'
                  )}
                  onClick={() => setSelection({ kind: 'section', sectionId: sec.id })}
                >
                  <div className="flex items-center gap-2 border-b border-[#243044] bg-[#151d2a] px-3 py-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-[#4a6278]" aria-hidden />
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) =>
                        onChange(updateSection(layout, sec.id, { title: e.target.value }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-0 flex-1 bg-transparent font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#e8f1f8] outline-none"
                    />
                    <label
                      className="flex items-center gap-1 font-mono text-[10px] text-[#6d8aa8]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={sec.collapsed}
                        onChange={(e) =>
                          onChange(updateSection(layout, sec.id, { collapsed: e.target.checked }))
                        }
                        className="accent-[#00d4aa]"
                      />
                      {t('app.dashboard.studio.collapsed')}
                    </label>
                    <button
                      type="button"
                      disabled={secIdx === 0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(moveSection(layout, sec.id, -1))
                      }}
                      className="rounded p-1 text-[#6d8aa8] hover:bg-[#1a2636] disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={secIdx === layout.sections.length - 1}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(moveSection(layout, sec.id, 1))
                      }}
                      className="rounded p-1 text-[#6d8aa8] hover:bg-[#1a2636] disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {layout.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onChange(removeSection(layout, sec.id))
                          setSelection(null)
                        }}
                        className="rounded p-1 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 p-3">
                    {sec.rows.map((row, rowIdx) => (
                      <div
                        key={row.id}
                        className={cn(
                          'rounded border border-dashed p-2',
                          (selection?.kind === 'row' || selection?.kind === 'cell') &&
                            selection.sectionId === sec.id &&
                            selection.rowId === row.id
                            ? 'border-[#00d4aa]/40 bg-[#00d4aa]/5'
                            : 'border-[#2a3f5f] bg-[#080c12]'
                        )}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'copy'
                        }}
                        onDrop={(e) => handleDropOnRow(sec.id, row.id, e)}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelection({ kind: 'row', sectionId: sec.id, rowId: row.id })
                        }}
                      >
                        {row.cells.length === 0 ? (
                          <p className="py-6 text-center font-mono text-[11px] text-[#4a6278]">
                            {t('app.dashboard.studio.dropHere')}
                          </p>
                        ) : (
                          <div className="grid grid-cols-12 gap-2">
                            {row.cells.map((cell) => {
                              const meta = DASHBOARD_WIDGET_META.find((m) => m.id === cell.widgetId)
                              const isSel =
                                selection?.kind === 'cell' && selection.cellId === cell.id
                              return (
                                <div
                                  key={cell.id}
                                  className={cn(
                                    'col-span-12 rounded border sm:col-span-6',
                                    cell.span === 12 && 'md:col-span-12',
                                    cell.span === 8 && 'lg:col-span-8',
                                    cell.span === 6 && 'md:col-span-6',
                                    cell.span === 4 && 'lg:col-span-4',
                                    cell.span === 3 && 'lg:col-span-3',
                                    isSel ? ACCENT_BORDER : 'border-[#2a3f5f]',
                                    cell.enabled ? 'bg-[#121a24]' : 'bg-[#0a0e14] opacity-50'
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelection({
                                      kind: 'cell',
                                      sectionId: sec.id,
                                      rowId: row.id,
                                      cellId: cell.id,
                                    })
                                  }}
                                >
                                  <div className="flex items-center justify-between border-b border-[#2a3f5f] bg-[#1a2636] px-2 py-1.5">
                                    <span className="font-mono text-[10px] font-bold uppercase text-[#8eb4d4]">
                                      {meta ? t(meta.labelKey) : cell.widgetId}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onChange(removeCell(layout, sec.id, row.id, cell.id))
                                        setSelection(null)
                                      }}
                                      className="text-[#6d8aa8] hover:text-red-400"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="px-2 py-3 font-mono text-[10px] text-[#4a6278]">
                                    span {cell.span}/12 ·{' '}
                                    {cell.enabled
                                      ? t('app.dashboard.studio.visible')
                                      : t('app.dashboard.studio.hidden')}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          <button
                            type="button"
                            disabled={rowIdx === 0}
                            onClick={(e) => {
                              e.stopPropagation()
                              onChange(moveRow(layout, sec.id, row.id, -1))
                            }}
                            className="rounded px-2 py-0.5 text-[10px] text-[#6d8aa8] hover:bg-[#1a2636] disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={rowIdx === sec.rows.length - 1}
                            onClick={(e) => {
                              e.stopPropagation()
                              onChange(moveRow(layout, sec.id, row.id, 1))
                            }}
                            className="rounded px-2 py-0.5 text-[10px] text-[#6d8aa8] hover:bg-[#1a2636] disabled:opacity-30"
                          >
                            ↓
                          </button>
                          {sec.rows.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onChange(removeRow(layout, sec.id, row.id))
                              }}
                              className="ml-auto rounded px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10"
                            >
                              {t('app.dashboard.studio.removeRow')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(addRow(layout, sec.id))
                      }}
                      className="w-full rounded border border-dashed border-[#2a3f5f] py-2 font-mono text-[10px] uppercase tracking-wide text-[#6d8aa8] hover:border-[#00d4aa]/40 hover:text-[#00d4aa]"
                    >
                      + {t('app.dashboard.studio.addRow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <section
          className={cn(
            'flex min-w-0 flex-col bg-[#060a10]',
            viewMode === 'design' && 'hidden',
            viewMode === 'split' && 'lg:w-1/2',
            viewMode === 'preview' && 'flex-1'
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[#243044] bg-[#0f141c] px-4 py-2">
            <div className="flex items-center gap-2">
              <Eye className={cn('h-4 w-4', ACCENT)} />
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#8eb4d4]">
                {t('app.dashboard.studio.livePreview')}
              </p>
            </div>
            <p className="text-[10px] text-[#4a7a9a]">
              {data.orgName} · {data.dateLabel}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <HoyDashboard data={data} layout={layout} studioPreview />
          </div>
        </section>
        </div>

        {/* Inspector */}
        {viewMode !== 'preview' && (
        <aside className={cn('flex w-[280px] shrink-0 flex-col border-l', PANEL, 'border-l-[#243044]')}>
          <div className="border-b border-[#243044] px-3 py-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d8aa8]">
              {t('app.dashboard.studio.inspector')}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 text-[13px]">
            {!selection && (
              <p className="text-[#6d8aa8]">{t('app.dashboard.studio.selectHint')}</p>
            )}
            {selectedSection && (
              <div className="space-y-3 text-[#c5d9eb]">
                <p className="font-mono text-[10px] uppercase text-[#6d8aa8]">Sección</p>
                <p>{selectedSection.title}</p>
                <p className="text-[12px] text-[#6d8aa8]">
                  {selectedSection.rows.length} filas
                </p>
              </div>
            )}
            {selectedCell && selection?.kind === 'cell' && (
              <div className="space-y-4">
                <p className="font-mono text-[10px] uppercase text-[#6d8aa8]">Widget</p>
                <p className="font-medium text-[#e8f1f8]">
                  {t(DASHBOARD_WIDGET_META.find((m) => m.id === selectedCell.widgetId)?.labelKey ?? '')}
                </p>
                <label className="flex items-center gap-2 text-[#c5d9eb]">
                  <input
                    type="checkbox"
                    checked={selectedCell.enabled}
                    disabled={selectedCell.widgetId === 'greeting'}
                    onChange={(e) =>
                      onChange(
                        updateCell(layout, selection.sectionId, selection.rowId, selection.cellId, {
                          enabled: e.target.checked,
                        })
                      )
                    }
                    className="accent-[#00d4aa]"
                  />
                  {t('app.dashboard.studio.visible')}
                </label>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#6d8aa8]">
                    {t('app.dashboard.studio.width')}
                  </label>
                  <select
                    value={selectedCell.span}
                    onChange={(e) =>
                      onChange(
                        updateCell(layout, selection.sectionId, selection.rowId, selection.cellId, {
                          span: Number(e.target.value) as GridSpan,
                        })
                      )
                    }
                    className="mt-1 w-full rounded border border-[#2a3f5f] bg-[#0a0e14] px-2 py-1.5 text-[12px] text-[#c5d9eb]"
                  >
                    <option value={12}>12/12 (completo)</option>
                    <option value={8}>8/12</option>
                    <option value={6}>6/12 (mitad)</option>
                    <option value={4}>4/12</option>
                    <option value={3}>3/12</option>
                  </select>
                </div>
              </div>
            )}
            <div className="mt-8 space-y-4 border-t border-[#243044] pt-4">
              <div>
                <label className="font-mono text-[10px] uppercase text-[#6d8aa8]">
                  {t('app.dashboard.exportNameLabel')}
                </label>
                <input
                  value={dashboardName}
                  onChange={(e) => {
                    onDashboardNameChange(e.target.value)
                    onExportNameChange(e.target.value)
                  }}
                  disabled={!canEditSharing}
                  className="mt-1 w-full rounded border border-[#2a3f5f] bg-[#0a0e14] px-2 py-1.5 text-[12px] text-[#c5d9eb] disabled:opacity-50"
                />
              </div>
              {canEditSharing ? (
                <div>
                  <p className="font-mono text-[10px] uppercase text-[#6d8aa8]">
                    {t('app.dashboard.picker.visibility')}
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#c5d9eb]">
                      <input
                        type="radio"
                        name="visibility"
                        checked={visibility === 'private'}
                        onChange={() => onVisibilityChange('private')}
                        className="accent-[#00d4aa]"
                      />
                      {t('app.dashboard.picker.private')}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#c5d9eb]">
                      <input
                        type="radio"
                        name="visibility"
                        checked={visibility === 'public'}
                        onChange={() => onVisibilityChange('public')}
                        className="accent-[#00d4aa]"
                      />
                      {t('app.dashboard.picker.public')}
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#6d8aa8]">
                    {visibility === 'public'
                      ? t('app.dashboard.picker.publicHint')
                      : t('app.dashboard.picker.privateHint')}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-[#6d8aa8]">
                  {t('app.dashboard.picker.readOnlyPanel')}
                </p>
              )}
            </div>
          </div>
        </aside>
        )}
      </div>
    </div>
  )
}
