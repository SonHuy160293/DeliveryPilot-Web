import { z } from "zod";
import * as shapes from "@/features/workspaces/api/contracts";
import * as inputs from "@/features/workspaces/api/inputs";
import {
  auditEvent,
  auditInput,
  type AuditInput,
} from "@/features/workspaces/api/auditContracts";
import {
  organizationPath,
  request,
  type SessionOwner,
} from "@/features/workspaces/api/request";

function memberPath(id: string, membershipId: string) {
  return `${organizationPath(id)}/members/${shapes.uuid.parse(membershipId)}`;
}
function rolePath(id: string, roleId: string) {
  return `${organizationPath(id)}/roles/${shapes.uuid.parse(roleId)}`;
}
function invitationPath(id: string, invitationId: string) {
  return `${organizationPath(id)}/invitations/${shapes.uuid.parse(invitationId)}`;
}
function nominationPath(id: string, nominationId: string) {
  return `${organizationPath(id)}/ownership-nominations/${shapes.uuid.parse(nominationId)}`;
}

/** Exactly the 27 non-proof browser operations in the published Gateway contract. */
export const workspaceApi = {
  discover: (
    owner: SessionOwner,
    params: inputs.PageInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      "api/v1/me/organizations",
      shapes.page(shapes.workspace),
      { params: inputs.pageInput.parse(params), signal },
    ),
  create: (
    owner: SessionOwner,
    input: { name: string; attemptId: string },
    signal?: AbortSignal,
  ) =>
    request(owner, "POST", "api/v1/organizations", shapes.creationSnapshot, {
      body: { name: inputs.workspaceName.parse(input.name) },
      attemptId: input.attemptId,
      signal,
    }),
  me: (owner: SessionOwner, id: string, signal?: AbortSignal) =>
    request(owner, "GET", `${organizationPath(id)}/members/me`, shapes.member, {
      signal,
    }),
  members: (
    owner: SessionOwner,
    id: string,
    params: inputs.MemberPageInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      `${organizationPath(id)}/members`,
      shapes.page(shapes.member),
      { params: inputs.memberPageInput.parse(params), signal },
    ),
  member: (
    owner: SessionOwner,
    id: string,
    membershipId: string,
    signal?: AbortSignal,
  ) =>
    request(owner, "GET", memberPath(id, membershipId), shapes.member, {
      signal,
    }),
  grant: (
    owner: SessionOwner,
    id: string,
    membershipId: string,
    roleId: string,
    input: z.input<typeof inputs.assignmentInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${memberPath(id, membershipId)}/roles/${shapes.uuid.parse(roleId)}/grant`,
      shapes.assignmentChange,
      { body: inputs.assignmentInput.parse(input), signal },
    ),
  revoke: (
    owner: SessionOwner,
    id: string,
    membershipId: string,
    roleId: string,
    input: z.input<typeof inputs.assignmentInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${memberPath(id, membershipId)}/roles/${shapes.uuid.parse(roleId)}/revoke`,
      shapes.assignmentChange,
      { body: inputs.assignmentInput.parse(input), signal },
    ),
  remove: (
    owner: SessionOwner,
    id: string,
    membershipId: string,
    input: z.input<typeof inputs.membershipInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${memberPath(id, membershipId)}/remove`,
      shapes.membershipChange,
      { body: inputs.membershipInput.parse(input), signal },
    ),
  demote: (
    owner: SessionOwner,
    id: string,
    membershipId: string,
    input: z.input<typeof inputs.membershipInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${memberPath(id, membershipId)}/demote-owner`,
      shapes.membershipChange,
      { body: inputs.membershipInput.parse(input), signal },
    ),
  permissions: (owner: SessionOwner, id: string, signal?: AbortSignal) =>
    request(
      owner,
      "GET",
      `${organizationPath(id)}/permissions`,
      shapes.delegablePermissions,
      { signal },
    ),
  roles: (
    owner: SessionOwner,
    id: string,
    params: inputs.PageInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      `${organizationPath(id)}/roles`,
      shapes.page(shapes.role),
      { params: inputs.pageInput.parse(params), signal },
    ),
  createRole: (
    owner: SessionOwner,
    id: string,
    input: inputs.RoleInput,
    signal?: AbortSignal,
  ) =>
    request(owner, "POST", `${organizationPath(id)}/roles`, shapes.role, {
      body: inputs.roleInput.parse(input),
      signal,
    }),
  updateRole: (
    owner: SessionOwner,
    id: string,
    roleId: string,
    input: z.input<typeof inputs.updateRoleInput>,
    signal?: AbortSignal,
  ) =>
    request(owner, "PUT", rolePath(id, roleId), shapes.role, {
      body: inputs.updateRoleInput.parse(input),
      signal,
    }),
  retireRole: (
    owner: SessionOwner,
    id: string,
    roleId: string,
    input: z.input<typeof inputs.reasonVersionInput>,
    signal?: AbortSignal,
  ) =>
    request(owner, "POST", `${rolePath(id, roleId)}/retire`, shapes.role, {
      body: inputs.reasonVersionInput.parse(input),
      signal,
    }),
  invitations: (
    owner: SessionOwner,
    id: string,
    params: inputs.LifecyclePageInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      `${organizationPath(id)}/invitations`,
      shapes.page(shapes.invitation),
      { params: inputs.lifecyclePageInput.parse(params), signal },
    ),
  invitation: (
    owner: SessionOwner,
    id: string,
    invitationId: string,
    signal?: AbortSignal,
  ) =>
    request(owner, "GET", invitationPath(id, invitationId), shapes.invitation, {
      signal,
    }),
  issue: (
    owner: SessionOwner,
    id: string,
    input: inputs.IssueInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${organizationPath(id)}/invitations`,
      shapes.invitation,
      { body: inputs.issueInput.parse(input), signal },
    ),
  resend: (
    owner: SessionOwner,
    id: string,
    invitationId: string,
    input: z.input<typeof inputs.optionalReasonVersionInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${invitationPath(id, invitationId)}/resend`,
      shapes.invitation,
      { body: inputs.optionalReasonVersionInput.parse(input), signal },
    ),
  reissue: (
    owner: SessionOwner,
    id: string,
    invitationId: string,
    input: z.input<typeof inputs.reissueInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${invitationPath(id, invitationId)}/reissue`,
      shapes.invitation,
      { body: inputs.reissueInput.parse(input), signal },
    ),
  cancelInvitation: (
    owner: SessionOwner,
    id: string,
    invitationId: string,
    input: z.input<typeof inputs.reasonVersionInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${invitationPath(id, invitationId)}/cancel`,
      shapes.invitation,
      { body: inputs.reasonVersionInput.parse(input), signal },
    ),
  nominate: (
    owner: SessionOwner,
    id: string,
    membershipId: string,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${organizationPath(id)}/ownership-nominations`,
      shapes.nomination,
      { body: { membershipId: shapes.uuid.parse(membershipId) }, signal },
    ),
  nominations: (
    owner: SessionOwner,
    id: string,
    params: inputs.LifecyclePageInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      `${organizationPath(id)}/ownership-nominations`,
      shapes.page(shapes.nomination),
      { params: inputs.lifecyclePageInput.parse(params), signal },
    ),
  myNominations: (
    owner: SessionOwner,
    params: inputs.LifecyclePageInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      "api/v1/me/ownership-nominations",
      shapes.page(shapes.nomination),
      { params: inputs.lifecyclePageInput.parse(params), signal },
    ),
  acceptNomination: (
    owner: SessionOwner,
    id: string,
    nominationId: string,
    input: z.input<typeof inputs.versionInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${nominationPath(id, nominationId)}/accept`,
      shapes.nomination,
      { body: inputs.versionInput.parse(input), signal },
    ),
  declineNomination: (
    owner: SessionOwner,
    id: string,
    nominationId: string,
    input: z.input<typeof inputs.versionInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${nominationPath(id, nominationId)}/decline`,
      shapes.nomination,
      { body: inputs.versionInput.parse(input), signal },
    ),
  cancelNomination: (
    owner: SessionOwner,
    id: string,
    nominationId: string,
    input: z.input<typeof inputs.optionalReasonVersionInput>,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "POST",
      `${nominationPath(id, nominationId)}/cancel`,
      shapes.nomination,
      { body: inputs.optionalReasonVersionInput.parse(input), signal },
    ),
  audit: (
    owner: SessionOwner,
    id: string,
    params: AuditInput,
    signal?: AbortSignal,
  ) =>
    request(
      owner,
      "GET",
      `${organizationPath(id)}/audit-events`,
      shapes.page(auditEvent),
      { params: auditInput.parse(params), signal },
    ),
};
