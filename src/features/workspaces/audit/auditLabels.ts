import { auditActions } from "@/features/workspaces/api/auditContracts";

export const auditLabels: Record<(typeof auditActions)[number], string> = {
  "organization.created": "Workspace created",
  "organization.membership.created": "Membership created",
  "organization.membership.status-changed": "Membership status changed",
  "organization.role-assignment.granted": "Role granted",
  "organization.role-assignment.revoked": "Role revoked",
  "organization.role-assignment.regranted": "Role granted again",
  "organization.role.created": "Role created",
  "organization.role.permissions-changed": "Role permissions changed",
  "organization.role.updated": "Role updated",
  "organization.role.retired": "Role retired",
  "organization.invitation.issued": "Invitation created",
  "organization.invitation.reissued": "Invitation replaced",
  "organization.invitation.resent": "Invitation resend requested",
  "organization.invitation.closed": "Invitation closed",
  "organization.ownership-nomination.created": "Owner nominated",
  "organization.ownership-nomination.closed": "Owner nomination closed",
};
