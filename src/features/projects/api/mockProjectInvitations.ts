import type { ProjectRepository } from "@/features/projects/api/projectRepository";
import type {
  ProjectWorkspace,
  ProjectRecord,
} from "@/features/projects/api/mockSupport";
import {
  before,
  access,
  requireAbility,
  parse,
  checkVersion,
  membership,
  recordEvent,
} from "@/features/projects/api/mockSupport";
import {
  projectConflict,
  projectNotFound,
} from "@/features/projects/api/projectErrors";
import * as shapes from "@/features/projects/api/contracts";
import { MOCK_PEOPLE } from "@/mocks/people";
import type { GuestInvitation } from "@/features/projects/api/types";
const oneWeek = 7 * 24 * 60 * 60 * 1000;
function expire(record: ProjectRecord) {
  for (const item of record.invitations)
    if (item.status === "Pending" && Date.parse(item.expiresAt) <= Date.now())
      item.status = "Expired";
}
function noDuplicate(record: ProjectRecord, email: string, excluding?: string) {
  if (
    record.invitations.some(
      (item) =>
        item.id !== excluding &&
        item.status === "Pending" &&
        item.recipientEmail.toLowerCase() === email.toLowerCase(),
    )
  )
    projectConflict("This person already has a pending invitation.");
}
export function createMockProjectInvitations(
  store: (workspaceId: string) => ProjectWorkspace,
) {
  const methods: Pick<
    ProjectRepository,
    "listInvitations" | "inviteGuest" | "resendInvitation" | "cancelInvitation"
  > = {
    async listInvitations(workspaceId, id, signal) {
      const current = await before("projects.listInvitations", signal),
        { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "manageGuests");
      expire(record);
      return structuredClone(record.invitations);
    },
    async inviteGuest(workspaceId, id, input) {
      const current = await before("projects.inviteGuest"),
        request = parse(shapes.inviteGuestRequest, input);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "manageGuests");
      expire(record);
      noDuplicate(record, request.recipientEmail);
      const person = MOCK_PEOPLE.find(
        (item) => item.primaryEmail.toLowerCase() === request.recipientEmail,
      );
      if (person && membership(person.id))
        projectConflict(
          "This person is a workspace member. Add them as a team member instead.",
        );
      if (
        person &&
        record.participants.some(
          (item) => item.userId === person.id && item.status === "Active",
        )
      )
        projectConflict("This person is already on the team.");
      const invitation: GuestInvitation = {
        id: crypto.randomUUID(),
        recipientEmail: request.recipientEmail,
        offeredRoleCode: request.offeredRoleCode,
        status: "Pending",
        issuedByUserId: current.person.id,
        lastIssuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + oneWeek).toISOString(),
        version: 1,
      };
      record.invitations.push(invitation);
      recordEvent(
        record,
        current,
        "GuestInvited",
        `Guest invitation sent to ${invitation.recipientEmail}`,
      );
      return structuredClone(invitation);
    },
    async resendInvitation(workspaceId, id, invitationId, expectedVersion) {
      const current = await before("projects.resendInvitation"),
        { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "manageGuests");
      parse(shapes.version, expectedVersion);
      expire(record);
      const item = record.invitations.find((row) => row.id === invitationId);
      if (!item) projectNotFound();
      checkVersion(item.version, expectedVersion);
      if (!["Pending", "Expired"].includes(item.status)) projectConflict();
      noDuplicate(record, item.recipientEmail, item.id);
      item.status = "Pending";
      item.lastIssuedAt = new Date().toISOString();
      item.expiresAt = new Date(Date.now() + oneWeek).toISOString();
      item.version++;
      recordEvent(
        record,
        current,
        "GuestInvitationResent",
        "Invitation resent",
      );
      return structuredClone(item);
    },
    async cancelInvitation(workspaceId, id, invitationId, expectedVersion) {
      const current = await before("projects.cancelInvitation"),
        { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "manageGuests");
      parse(shapes.version, expectedVersion);
      expire(record);
      const item = record.invitations.find((row) => row.id === invitationId);
      if (!item) projectNotFound();
      checkVersion(item.version, expectedVersion);
      if (item.status !== "Pending") projectConflict();
      item.status = "Cancelled";
      item.version++;
      recordEvent(
        record,
        current,
        "GuestInvitationCancelled",
        "Invitation cancelled",
      );
      return structuredClone(item);
    },
  };
  return methods;
}
