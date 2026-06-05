const PLACEHOLDER_URL = 'https://your-project.supabase.co'

export type SupabaseEnv = {
  url: string
  anonKey: string
}

const CONFIG_MESSAGE =
  'Configurá Supabase en .env.local con tu Project URL y anon key (Dashboard → Settings → API).'

/** Devuelve null si faltan credenciales o siguen siendo placeholders. */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null
  if (url === PLACEHOLDER_URL || url.includes('your-project')) return null
  if (anonKey.startsWith('sb_publishable_') || anonKey.length < 100) return null

  return { url, anonKey }
}

/** Solo para acciones de auth en el cliente — muestra error claro en el formulario. */
export function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv()
  if (!env) {
    throw new Error(CONFIG_MESSAGE)
  }
  return env
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null
}

/** Service role — solo servidor (/ops, Connect). Nunca en el cliente. */
export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) return false
  if (key.startsWith('eyJ') && key.length > 80) return true
  return key.length > 40
}
