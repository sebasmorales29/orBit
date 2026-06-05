export type OwnerAssignableRole = 'owner' | 'admin' | 'administrator' | 'member' | 'visitor'

export function normalizeRoleForDb(role: OwnerAssignableRole): string {
  return role === 'administrator' ? 'admin' : role
}

export function canAssignOwnerRole(
  subscriptionOwnerId: string | null | undefined,
  targetUserId: string
): boolean {
  if (!subscriptionOwnerId) return true
  return subscriptionOwnerId === targetUserId
}

export function ownerRoleBlockedMessage(): string {
  return 'Solo el dueño de la suscripción puede tener rol Owner. Invitá con Administrator, Member o Visitor.'
}
