import { createHash, randomBytes } from 'crypto'

const PREFIX = 'orbit_wh_'

export function generateWebhookSecret(): string {
  return `${PREFIX}${randomBytes(24).toString('base64url')}`
}

export function hashWebhookSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export function secretDisplayPrefix(secret: string): string {
  return secret.slice(0, 14)
}

export function timingSafeEqualSecret(provided: string, storedHash: string): boolean {
  const hash = hashWebhookSecret(provided)
  if (hash.length !== storedHash.length) return false
  let diff = 0
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i)
  }
  return diff === 0
}
