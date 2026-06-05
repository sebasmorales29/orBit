export const OPS_ENTRY_COOKIE = 'orbit-ops-entry'

export function opsEntryCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/ops',
  }
}
