import { z } from "zod";
import {
  lifecycle,
  memberStatus,
  revision,
  uuid,
} from "@/features/workspaces/api/contracts";

export const workspaceName = z
  .string()
  .trim()
  .min(1, "Enter a workspace name.")
  .max(160, "Use 160 characters or fewer.");
export const safeReason = z
  .string()
  .trim()
  .min(1, "Enter a reason.")
  .max(1000, "Use 1,000 characters or fewer.")
  .refine(
    (value) =>
      !/(?:https?:\/\/|www\.|\b\S+@\S+\.\S+|bearer\s|(?:token|password|secret)\s*=)/i.test(
        value,
      ),
    "Use a business reason without links, email addresses, or credentials.",
  );
export const optionalReason = safeReason.nullable().optional();
export const pageInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    cursor: z.string().min(1).max(1024).optional(),
  })
  .strict();
export const memberPageInput = pageInput.extend({
  status: memberStatus.default("active"),
});
export const lifecyclePageInput = pageInput.extend({
  status: lifecycle.default("pending"),
});
export const delegableCodes = [
  "organization.members.read",
  "organization.members.remove",
  "organization.invitations.read",
  "organization.invitations.issue",
  "organization.invitations.resend",
  "organization.invitations.reissue",
  "organization.invitations.cancel",
  "organization.roles.manage",
  "organization.roles.assign",
  "organization.audit.read",
] as const;
const distinctCodes = z
  .array(
    z
      .string()
      .refine(
        (value) => delegableCodes.some((code) => code === value),
        "Choose a registered delegable permission.",
      ),
  )
  .min(1, "Select at least one permission.")
  .refine(
    (values) => new Set(values).size === values.length,
    "Select distinct permissions.",
  );
export const roleInput = z
  .object({
    name: workspaceName,
    description: z.string().max(1000).nullable(),
    permissionCodes: distinctCodes,
  })
  .strict();
export const updateRoleInput = roleInput.extend({ expectedVersion: revision });
export const reasonVersionInput = z
  .object({ expectedVersion: revision, reason: safeReason })
  .strict();
export const optionalReasonVersionInput = z
  .object({ expectedVersion: revision, reason: optionalReason })
  .strict();
export const versionInput = z.object({ expectedVersion: revision }).strict();
export const assignmentInput = z
  .object({ expectedMembershipVersion: revision, reason: optionalReason })
  .strict();
export const membershipInput = z
  .object({ expectedMembershipVersion: revision, reason: safeReason })
  .strict();
export const roleIds = z
  .array(uuid)
  .min(1, "Select at least one role.")
  .refine(
    (values) =>
      new Set(values.map((id) => id.toLowerCase())).size === values.length,
    "Select distinct roles.",
  );
export const issueInput = z
  .object({
    recipientEmail: z
      .string()
      .trim()
      .min(3)
      .max(320)
      .pipe(z.email("Enter a valid email address.")),
    roleIds,
  })
  .strict();
export const reissueInput = reasonVersionInput.extend({ roleIds });
export const proofInput = z
  .object({ proof: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
  .strict();
export const proofVersionInput = proofInput.extend({
  expectedVersion: revision,
});
export type PageInput = z.input<typeof pageInput>;
export type MemberPageInput = z.input<typeof memberPageInput>;
export type LifecyclePageInput = z.input<typeof lifecyclePageInput>;
export type RoleInput = z.infer<typeof roleInput>;
export type IssueInput = z.infer<typeof issueInput>;
