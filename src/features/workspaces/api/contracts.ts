import { z } from "zod";
import { ApiError } from "@/lib/api/apiError";

export const uuid = z
  .string()
  .regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i)
  .refine(
    (value) => value !== "00000000-0000-0000-0000-000000000000",
    "Choose a valid identifier.",
  );
export const revision = z
  .number()
  .int()
  .positive()
  .refine(Number.isSafeInteger);
export const timestamp = z.iso.datetime({ offset: true });
export const lifecycle = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
]);
export const memberStatus = z.enum(["active", "removed", "suspended"]);
export const roleBadge = z.object({
  id: uuid,
  code: z.string(),
  name: z.string(),
});
export const workspace = z.object({
  organizationId: uuid,
  name: z.string(),
  roles: z.array(roleBadge),
  membershipId: uuid,
  version: revision,
  membershipVersion: revision,
});
export const creationSnapshot = z.object({
  organizationId: uuid,
  name: z.string(),
  status: z.literal("active"),
  membershipId: uuid,
  roles: z.array(z.string()),
  version: revision,
  membershipVersion: revision,
  resultKind: z.literal("creationSnapshot"),
  snapshotAt: timestamp,
});
export const member = z.object({
  membershipId: uuid,
  userId: uuid,
  displayName: z.string(),
  primaryEmail: z.string(),
  status: memberStatus,
  roles: z.array(roleBadge),
  joinedAt: timestamp,
  version: revision,
});
export const role = z.object({
  id: uuid,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  origin: z.enum(["system", "custom"]),
  permissionCodes: z.array(z.string()),
  version: revision,
  permissionSetVersion: revision,
  retiredAt: timestamp.nullable(),
});
export const delegablePermissions = z.object({ codes: z.array(z.string()) });
export const assignmentChange = z.object({
  membershipId: uuid,
  version: revision,
  roles: z.array(roleBadge),
  changed: z.boolean(),
});
export const membershipChange = assignmentChange.extend({
  status: memberStatus,
});
export const offeredRole = z.object({
  roleId: uuid,
  name: z.string(),
  permissionSetVersion: revision,
});
export const delivery = z.object({
  status: z.enum([
    "queued",
    "retrying",
    "provider-accepted",
    "delivered",
    "bounced",
    "complained",
    "failed",
    "suppressed",
    "expired",
    "obsolete",
  ]),
  failureCode: z.string().nullable(),
  updatedAt: timestamp,
});
export const invitation = z.object({
  id: uuid,
  organizationId: uuid,
  recipientEmail: z.string(),
  status: lifecycle,
  offeredRoles: z.array(offeredRole),
  expiresAt: timestamp,
  version: revision,
  delivery,
});
export const invitationPreview = z.object({
  invitationId: uuid,
  organizationId: uuid,
  workspaceName: z.string(),
  offeredRoles: z.array(offeredRole),
  expiresAt: timestamp,
  version: revision,
  status: z.literal("pending"),
  canAccept: z.boolean(),
  requiresReissue: z.boolean(),
});
export const invitationAcceptance = z.object({
  outcome: z.enum(["accepted", "alreadyAccepted"]),
  membershipId: uuid,
  organizationId: uuid,
  roles: z.array(roleBadge),
  membershipVersion: revision,
});
export const invitationDecline = z.object({
  outcome: z.literal("declined"),
  status: z.literal("declined"),
  version: revision,
});
export const nomination = z.object({
  id: uuid,
  organizationId: uuid,
  membershipId: uuid,
  nominatedByUserId: uuid,
  status: lifecycle,
  createdAt: timestamp,
  expiresAt: timestamp,
  version: revision,
  canAccept: z.boolean(),
});
export function page<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().max(1024).nullable(),
  });
}
export function decode<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ApiError("protocol", "The workspace response could not be read.");
  return result.data;
}
export type Workspace = z.infer<typeof workspace>;
export type Member = z.infer<typeof member>;
export type Role = z.infer<typeof role>;
export type Invitation = z.infer<typeof invitation>;
export type Nomination = z.infer<typeof nomination>;
export type InvitationPreview = z.infer<typeof invitationPreview>;
export type InvitationAcceptance = z.infer<typeof invitationAcceptance>;
export type CreationSnapshot = z.infer<typeof creationSnapshot>;
