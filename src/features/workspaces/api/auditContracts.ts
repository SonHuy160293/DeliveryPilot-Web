import { z } from "zod";
import { pageInput } from "@/features/workspaces/api/inputs";
import { revision, timestamp, uuid } from "@/features/workspaces/api/contracts";

const text = z.string().nullable();
const codes = z.array(z.string()).max(512);
const ids = z.array(uuid).max(512);
const permissionChanges = z.object({
  origin: z.string(),
  templateVersion: revision.nullable(),
  previousPermissionSetVersion: revision.nullable(),
  permissionSetVersion: revision,
  addedPermissionCodes: codes,
  removedPermissionCodes: codes,
  permissionCodes: codes,
});
const offerChanges = z.object({
  issuedByUserId: uuid,
  offeredRoleIds: ids,
  expiresAt: timestamp,
  replacesInvitationId: uuid.nullable(),
});
const nominationChanges = z.object({
  nominatedByUserId: uuid,
  previousStatus: z.string().nullable(),
  newStatus: z.string(),
  expiresAt: timestamp,
  closedByUserId: uuid.nullable(),
  closedAt: timestamp.nullable(),
});
const grant = {
  roleId: uuid,
  grantVersion: revision,
  grantedAt: timestamp,
  expiresAt: timestamp.nullable(),
};
const base = z.object({
  eventId: uuid,
  actorUserId: uuid.nullable(),
  actorDisplayName: text,
  organizationId: uuid,
  targetId: uuid,
  occurredAt: timestamp,
  outcome: z.literal("succeeded"),
  aggregateVersion: revision,
  membershipVersion: revision.nullable(),
  eventOrdinal: revision,
  reason: text,
});
function event<A extends string, T extends string, S extends z.ZodType>(
  action: A,
  targetType: T,
  changes: S,
) {
  return base.extend({
    action: z.literal(action),
    targetType: z.literal(targetType),
    changes,
  });
}
export const auditActions = [
  "organization.created",
  "organization.membership.created",
  "organization.membership.status-changed",
  "organization.role-assignment.granted",
  "organization.role-assignment.revoked",
  "organization.role-assignment.regranted",
  "organization.role.created",
  "organization.role.permissions-changed",
  "organization.role.updated",
  "organization.role.retired",
  "organization.invitation.issued",
  "organization.invitation.reissued",
  "organization.invitation.resent",
  "organization.invitation.closed",
  "organization.ownership-nomination.created",
  "organization.ownership-nomination.closed",
] as const;
export const auditEvent = z.discriminatedUnion("action", [
  event(
    auditActions[0],
    "Organization",
    z.object({ name: text, status: z.string(), createdByUserId: uuid }),
  ),
  event(
    auditActions[1],
    "OrganizationMembership",
    z.object({ userId: uuid, previousStatus: z.null(), newStatus: z.string() }),
  ),
  event(
    auditActions[2],
    "OrganizationMembership",
    z.object({
      userId: uuid,
      previousStatus: z.string(),
      newStatus: z.string(),
    }),
  ),
  event(
    auditActions[3],
    "OrganizationRoleAssignment",
    z.object({
      ...grant,
      grantedByUserId: uuid,
      permissionSetVersion: revision,
    }),
  ),
  event(
    auditActions[4],
    "OrganizationRoleAssignment",
    z.object({ ...grant, revokedAt: timestamp }),
  ),
  event(
    auditActions[5],
    "OrganizationRoleAssignment",
    z.object({
      ...grant,
      previousGrantVersion: revision,
      grantedByUserId: uuid,
      permissionSetVersion: revision,
    }),
  ),
  event(auditActions[6], "OrganizationRole", permissionChanges),
  event(auditActions[7], "OrganizationRole", permissionChanges),
  event(
    auditActions[8],
    "OrganizationRole",
    z.object({
      previousName: text,
      newName: text,
      descriptionChanged: z.boolean(),
    }),
  ),
  event(
    auditActions[9],
    "OrganizationRole",
    z.object({
      code: z.string(),
      name: text,
      retiredAt: timestamp,
      permissionSetVersion: revision,
    }),
  ),
  event(auditActions[10], "OrganizationInvitation", offerChanges),
  event(auditActions[11], "OrganizationInvitation", offerChanges),
  event(auditActions[12], "OrganizationInvitation", offerChanges),
  event(
    auditActions[13],
    "OrganizationInvitation",
    z.object({
      previousStatus: z.string(),
      newStatus: z.string(),
      closedByUserId: uuid.nullable(),
      closedAt: timestamp,
    }),
  ),
  event(
    auditActions[14],
    "OrganizationOwnershipNomination",
    nominationChanges.extend({ previousStatus: z.null() }),
  ),
  event(
    auditActions[15],
    "OrganizationOwnershipNomination",
    nominationChanges.extend({ previousStatus: z.string() }),
  ),
]);
const filterInstant = timestamp.refine(
  (value) =>
    value.length <= 40 &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,7})?(?:Z|[+-]\d\d:\d\d)$/.test(
      value,
    ),
);
export const auditInput = pageInput
  .extend({
    actorUserId: uuid.optional(),
    membershipId: uuid.optional(),
    targetId: uuid.optional(),
    action: z.enum(auditActions).optional(),
    from: filterInstant.optional(),
    to: filterInstant.optional(),
  })
  .refine(
    (value) =>
      !value.from || !value.to || Date.parse(value.from) < Date.parse(value.to),
    "The start must be before the end.",
  );
export type AuditEvent = z.infer<typeof auditEvent>;
export type AuditInput = z.input<typeof auditInput>;
