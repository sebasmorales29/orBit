'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformStats } from '@/lib/platform/platform-stats'
import { listTenantPacks } from '@/lib/platform/packs'
import { listProvisionedTenants, provisionTenant } from '@/lib/platform/provision-tenant'
import { checkPlatformSchema } from '@/lib/platform/schema-health'
import {
  deleteTenant,
  getTenantDetail,
  removeTenantMember,
  revokeTenantInvite,
  setTenantInviteRole,
  setTenantMemberRole,
  updateTenant,
  type UpdateTenantInput,
} from '@/lib/platform/tenant-admin'
import {
  addOpsAdmin,
  disableOpsUserMfa,
  listOpsAdmins,
  removeOpsAdmin,
  setOpsAdminMfaRequired,
} from '@/lib/platform/ops-access'
import {
  startSuperAdminEmailChallenge,
  assertSuperAdminAal2,
  verifySuperAdminEmailChallenge,
  preverifySuperAdminEmailChallenge,
  type Purpose,
} from '@/lib/platform/security-email'
import {
  deletePlatformUser,
  deactivateUser,
  reactivateUser,
  getPlatformUserDetail,
  listPlatformUsers,
  setUserMembership,
  updatePlatformUser,
} from '@/lib/platform/users-admin'
import type { ProvisionTenantInput, ProvisionTenantResult, TenantListResult } from '@/lib/platform/types'
import { inviteUserToTenant, listTenantInvites } from '@/lib/platform/invites'
import {
  archiveContactRequest,
  deleteContactRequest,
  getPlatformContactRequest,
  listPlatformContactRequests,
  sendContactRequestEmail,
  updateContactRequestNotes,
  updateContactRequestStatus,
  type ContactRequestStatus,
} from '@/lib/platform/contact-requests'

export async function opsCheckSchema() {
  return checkPlatformSchema()
}

export async function opsGetPlatformStats() {
  return getPlatformStats()
}

export async function opsListPacks() {
  return listTenantPacks()
}

export async function opsListTenants(): Promise<TenantListResult> {
  return listProvisionedTenants()
}

export async function opsProvisionTenant(
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  const result = await provisionTenant(input)
  if (result.ok) {
    revalidatePath('/ops')
    revalidatePath('/ops/tenants')
  }
  return result
}

export async function opsGetTenant(orgId: string) {
  return getTenantDetail(orgId)
}

export async function opsListTenantInvites(orgId: string) {
  return listTenantInvites(orgId)
}

export async function opsInviteUserToTenant(input: {
  organizationId: string
  organizationName: string
  inviterEmail: string
  inviterName: string
  email: string
  role: 'owner' | 'administrator' | 'member' | 'visitor'
  expiresIn: '1h' | '24h' | '7d' | '30d'
}) {
  const result = await inviteUserToTenant(input)
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsSetTenantMemberRoleSecure(input: {
  organizationId: string
  userId: string
  role: 'owner' | 'administrator' | 'member' | 'visitor'
  challengeId: string
  code: string
}) {
  const gate = await requireSuperAdminDoubleConfirm({
    purpose: 'ASSIGN_USER_TENANT',
    challengeId: input.challengeId,
    code: input.code,
  })
  if (!gate.ok) return gate

  const role = input.role === 'administrator' ? 'admin' : input.role
  const result = await setTenantMemberRole({
    organizationId: input.organizationId,
    userId: input.userId,
    role,
  })
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsSetTenantInviteRoleSecure(input: {
  organizationId: string
  inviteId: string
  role: 'owner' | 'administrator' | 'member' | 'visitor'
  challengeId: string
  code: string
}) {
  const gate = await requireSuperAdminDoubleConfirm({
    purpose: 'ASSIGN_USER_TENANT',
    challengeId: input.challengeId,
    code: input.code,
  })
  if (!gate.ok) return gate

  const role = input.role === 'administrator' ? 'admin' : input.role
  const result = await setTenantInviteRole({
    organizationId: input.organizationId,
    inviteId: input.inviteId,
    role,
  })
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

// Cambios de roles dentro del detalle del tenant (sin MFA).
export async function opsSetTenantMemberRole(input: {
  organizationId: string
  userId: string
  role: 'owner' | 'administrator' | 'member' | 'visitor'
}) {
  const role = input.role === 'administrator' ? 'admin' : input.role
  const result = await setTenantMemberRole({
    organizationId: input.organizationId,
    userId: input.userId,
    role,
  })
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsSetTenantInviteRole(input: {
  organizationId: string
  inviteId: string
  role: 'owner' | 'administrator' | 'member' | 'visitor'
}) {
  const role = input.role === 'administrator' ? 'admin' : input.role
  const result = await setTenantInviteRole({
    organizationId: input.organizationId,
    inviteId: input.inviteId,
    role,
  })
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsRevokeTenantInvite(input: {
  organizationId: string
  inviteId: string
}) {
  const result = await revokeTenantInvite({
    organizationId: input.organizationId,
    inviteId: input.inviteId,
  })
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsRemoveTenantMember(input: {
  organizationId: string
  userId: string
}) {
  const result = await removeTenantMember({
    organizationId: input.organizationId,
    userId: input.userId,
  })
  if (result.ok) {
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsUpdateTenant(orgId: string, input: UpdateTenantInput) {
  const result = await updateTenant(orgId, input)
  if (result.ok) {
    revalidatePath('/ops')
    revalidatePath('/ops/tenants')
    revalidatePath(`/ops/tenants/${orgId}`)
  }
  return result
}

export async function opsDeleteTenant(orgId: string) {
  const result = await deleteTenant(orgId)
  if (result.ok) {
    revalidatePath('/ops')
    revalidatePath('/ops/tenants')
  }
  return result
}

export async function opsListUsers() {
  return listPlatformUsers()
}

export async function opsGetUser(userId: string) {
  return getPlatformUserDetail(userId)
}

export async function opsUpdateUser(userId: string, input: { full_name: string | null }) {
  const result = await updatePlatformUser({ userId, full_name: input.full_name })
  if (result.ok) {
    revalidatePath('/ops/users')
    revalidatePath(`/ops/users/${userId}`)
  }
  return result
}

export async function opsDeleteUserSecure(input: { userId: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'DELETE_USER', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await deletePlatformUser(input.userId)
  if (result.ok) {
    revalidatePath('/ops/users')
  }
  return result
}

export async function opsDeactivateUserSecure(input: { userId: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'DEACTIVATE_USER', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await deactivateUser(input.userId)
  if (result.ok) {
    revalidatePath('/ops/users')
    revalidatePath(`/ops/users/${input.userId}`)
  }
  return result
}

export async function opsReactivateUserSecure(input: { userId: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'REACTIVATE_USER', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await reactivateUser(input.userId)
  if (result.ok) {
    revalidatePath('/ops/users')
    revalidatePath(`/ops/users/${input.userId}`)
  }
  return result
}

export async function opsAssignUserTenantSecure(input: { userId: string; organizationId: string; role: 'owner' | 'administrator' | 'member' | 'visitor'; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'ASSIGN_USER_TENANT', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await setUserMembership({
    userId: input.userId,
    organizationId: input.organizationId,
    role: input.role,
  })
  if (result.ok) {
    revalidatePath('/ops/users')
    revalidatePath(`/ops/users/${input.userId}`)
    revalidatePath(`/ops/tenants/${input.organizationId}`)
  }
  return result
}

export async function opsListAccessAdmins() {
  return listOpsAdmins()
}

export async function opsAddAccessAdmin(email: string) {
  const result = await addOpsAdmin(email)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsRemoveAccessAdmin(id: string) {
  const result = await removeOpsAdmin(id)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsSetAccessMfaRequired(id: string, required: boolean) {
  const result = await setOpsAdminMfaRequired(id, required)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsDisableUserMfa(payload: { userId?: string | null; email: string }) {
  const result = await disableOpsUserMfa(payload)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsStartSuperAdminEmailConfirm(purpose: 'DISABLE_SUPER_ADMIN_MFA' | 'SUPER_ADMIN_CHANGE') {
  return startSuperAdminEmailChallenge(purpose)
}

export async function opsVerifySuperAdminEmailConfirm(input: { challengeId: string; code: string }) {
  return verifySuperAdminEmailChallenge(input)
}

export async function opsPreverifySuperAdminEmailConfirm(input: { challengeId: string; code: string; purpose: Purpose }) {
  return preverifySuperAdminEmailChallenge({
    challengeId: input.challengeId,
    code: input.code,
    expectedPurpose: input.purpose,
  })
}

async function requireSuperAdminDoubleConfirm(input: {
  purpose: Purpose
  challengeId: string
  code: string
}) {
  const aal = await assertSuperAdminAal2()
  if (!aal.ok) return aal
  const verified = await verifySuperAdminEmailChallenge({
    challengeId: input.challengeId,
    code: input.code,
    expectedPurpose: input.purpose,
    mode: 'consume',
  })
  if (!verified.ok) return verified
  return { ok: true as const }
}

export async function opsStartSuperAdminEmailConfirmV2(purpose: Purpose) {
  return startSuperAdminEmailChallenge(purpose)
}

export async function opsAddAccessAdminSecure(input: { email: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'OPS_ACCESS_CHANGE', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await addOpsAdmin(input.email)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsRemoveAccessAdminSecure(input: { id: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'OPS_ACCESS_CHANGE', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await removeOpsAdmin(input.id)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsSetAccessMfaRequiredSecure(input: { id: string; required: boolean; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'OPS_ACCESS_CHANGE', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await setOpsAdminMfaRequired(input.id, input.required)
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsDisableUserMfaSecure(input: { userId?: string | null; email: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'OPS_ACCESS_CHANGE', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await disableOpsUserMfa({ userId: input.userId, email: input.email })
  if (result.ok) {
    revalidatePath('/ops/access')
    revalidatePath('/ops')
  }
  return result
}

export async function opsDeleteTenantSecure(input: { orgId: string; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'DELETE_TENANT', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate
  const result = await deleteTenant(input.orgId)
  if (result.ok) {
    revalidatePath('/ops')
    revalidatePath('/ops/tenants')
  }
  return result
}

export async function opsSuspendTenantSecure(input: { orgId: string; suspended: boolean; challengeId: string; code: string }) {
  const gate = await requireSuperAdminDoubleConfirm({ purpose: 'SUSPEND_TENANT', challengeId: input.challengeId, code: input.code })
  if (!gate.ok) return gate

  const status = input.suspended ? 'suspended' : 'active'
  const result = await updateTenant(input.orgId, { platform_status: status })
  if (result.ok) {
    revalidatePath('/ops')
    revalidatePath('/ops/tenants')
    revalidatePath(`/ops/tenants/${input.orgId}`)
  }
  return result
}

export async function opsListContactRequests(includeArchived?: boolean) {
  return listPlatformContactRequests({ includeArchived })
}

export async function opsGetContactRequest(id: string) {
  return getPlatformContactRequest(id)
}

export async function opsUpdateContactRequestStatus(id: string, status: ContactRequestStatus) {
  const result = await updateContactRequestStatus(id, status)
  if (result.ok) {
    revalidatePath('/ops/inquiries')
    revalidatePath(`/ops/inquiries/${id}`)
  }
  return result
}

export async function opsUpdateContactRequestNotes(id: string, opsNotes: string) {
  const result = await updateContactRequestNotes(id, opsNotes)
  if (result.ok) {
    revalidatePath(`/ops/inquiries/${id}`)
  }
  return result
}

export async function opsArchiveContactRequest(id: string) {
  const result = await archiveContactRequest(id)
  if (result.ok) {
    revalidatePath('/ops/inquiries')
    revalidatePath(`/ops/inquiries/${id}`)
  }
  return result
}

export async function opsDeleteContactRequest(id: string) {
  const result = await deleteContactRequest(id)
  if (result.ok) {
    revalidatePath('/ops/inquiries')
  }
  return result
}

export async function opsSendContactRequestEmail(input: {
  id: string
  subject: string
  body: string
}) {
  const result = await sendContactRequestEmail(input)
  if (result.ok) {
    revalidatePath('/ops/inquiries')
    revalidatePath(`/ops/inquiries/${input.id}`)
  }
  return result
}
