import type { Messages } from './messages/es'

export type { Messages }

export function translate(
  messages: Messages,
  key: string,
  params?: Record<string, string | number>
): string {
  const parts = key.split('.')
  let cur: unknown = messages

  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in cur) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return key
    }
  }

  if (typeof cur !== 'string') return key

  if (!params) return cur

  return cur.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] != null ? String(params[name]) : `{${name}}`
  )
}
