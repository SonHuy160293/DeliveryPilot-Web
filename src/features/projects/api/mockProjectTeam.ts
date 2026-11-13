import type { ProjectRepository } from "@/features/projects/api/projectRepository";
import type {
  ProjectWorkspace,
  ProjectActor,
} from "@/features/projects/api/mockSupport";
import {
  before,
  access,
  requireAbility,
  parse,
  checkVersion,
  preserveAdministrator,
  membership,
  clearPo,
  recordEvent,
  present,
} from "@/features/projects/api/mockSupport";
import {
  projectConflict,
  projectForbidden,
  projectNotFound,
} from "@/features/projects/api/projectErrors";
import * as shapes from "@/features/projects/api/contracts";
import { ApiError } from "@/lib/api/apiError";
export function createMockProjectTeam(
  store: (workspaceId: string) => ProjectWorkspace,
  locate: (id: string, current: ProjectActor) => ProjectWorkspace,
) {
  const methods: Pick<
    ProjectRepository,
    | "listParticipants"
    | "addParticipant"
    | "changeRoles"
    | "endParticipation"
    | "leave"
    | "assignClientPo"
  > = {
    async listParticipants(workspaceId, id, signal) {
      const current = await before("projects.listParticipants", signal);
      const { record, participant } = access(
        store(workspaceId),
        id,
        current,
        true,
      );
      const rows =
        participant.kind === "Guest"
          ? record.participants
              .filter((item) => item.status === "Active")
              .map((item) => ({ ...item, primaryEmail: null }))
          : record.participants;
      return structuredClone(rows);
    },
    async addParticipant(workspaceId, id, input) {
      const current = await before("projects.addParticipant"),
        request = parse(shapes.addParticipantRequest, input);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "manageParticipants");
      if (
        request.roles.includes("ProjectAdministrator") &&
        !permissions.manageAdministrators
      )
        projectForbidden();
      const person = membership(request.userId);
      if (!person)
        throw new ApiError(
          "validation",
          "This person isn't an active member of the workspace.",
          {
            status: 422,
            fieldErrors: {
              userId: ["This person isn't an active member of the workspace."],
            },
          },
        );
      let target = record.participants.find(
        (item) => item.userId === request.userId,
      );
      if (target?.status === "Active")
        projectConflict("This person is already on the team.");
      const now = new Date().toISOString();
      if (target) {
        target.status = "Active";
        target.kind = "Member";
        target.roles = request.roles;
        target.activeSince = now;
        target.version++;
      } else {
        target = {
          id: crypto.randomUUID(),
          userId: person.id,
          displayName: person.displayName,
          primaryEmail: person.primaryEmail,
          kind: "Member",
          status: "Active",
          roles: request.roles,
          firstJoinedAt: now,
          activeSince: now,
          isClientProductOwner: false,
          version: 1,
        };
        record.participants.push(target);
      }
      recordEvent(
        record,
        current,
        "ParticipantAdded",
        `${person.displayName} added to the team`,
      );
      return structuredClone(target);
    },
    async changeRoles(workspaceId, id, participantId, input) {
      const current = await before("projects.changeRoles"),
        request = parse(shapes.changeRolesRequest, input);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "manageParticipants");
      const target = record.participants.find(
        (item) => item.id === participantId && item.status === "Active",
      );
      if (!target) projectNotFound();
      checkVersion(target.version, request.expectedVersion);
      const wasAdmin = target.roles.includes("ProjectAdministrator"),
        willBeAdmin = request.roles.includes("ProjectAdministrator");
      if (target.kind === "Guest" && willBeAdmin)
        throw new ApiError(
          "validation",
          "Guests cannot be project administrators.",
          {
            status: 422,
            fieldErrors: {
              roles: ["Guests cannot be project administrators."],
            },
          },
        );
      if (wasAdmin !== willBeAdmin && !permissions.manageAdministrators)
        projectForbidden();
      preserveAdministrator(record, target, willBeAdmin);
      target.roles = request.roles;
      target.version++;
      recordEvent(record, current, "ParticipantRolesChanged", "Roles updated");
      return structuredClone(target);
    },
    async endParticipation(workspaceId, id, participantId, input) {
      const current = await before("projects.endParticipation"),
        request = parse(shapes.endParticipationRequest, input);
      const { record, permissions } = access(store(workspaceId), id, current);
      const target = record.participants.find(
        (item) => item.id === participantId && item.status === "Active",
      );
      if (!target) projectNotFound();
      requireAbility(
        permissions,
        target.kind === "Guest" ? "manageGuests" : "manageParticipants",
      );
      checkVersion(target.version, request.expectedVersion);
      if (
        target.roles.includes("ProjectAdministrator") &&
        !permissions.manageAdministrators
      )
        projectForbidden();
      preserveAdministrator(record, target, false);
      target.status = target.kind === "Guest" ? "Revoked" : "Removed";
      target.version++;
      clearPo(record, target);
      recordEvent(
        record,
        current,
        "ParticipantRemoved",
        target.kind === "Guest"
          ? "Guest access revoked"
          : "Removed from the project",
        request.reason,
      );
    },
    async leave(id) {
      const current = await before("projects.leave", undefined, "portal");
      const { record, participant } = access(
        locate(id, current),
        id,
        current,
        true,
      );
      if (participant.kind !== "Guest") projectForbidden();
      participant.status = "Left";
      participant.version++;
      clearPo(record, participant);
      recordEvent(record, current, "GuestLeft", "Guest left the project");
    },
    async assignClientPo(workspaceId, id, participantId, expectedVersion) {
      const current = await before("projects.assignClientPo");
      parse(shapes.version, expectedVersion);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "assignClientPo");
      checkVersion(record.detail.version, expectedVersion);
      if (record.detail.kind !== "Client") projectConflict();
      const target =
        participantId === null
          ? undefined
          : record.participants.find(
              (item) =>
                item.id === participantId &&
                item.kind === "Guest" &&
                item.status === "Active",
            );
      if (participantId !== null && !target) projectNotFound();
      for (const item of record.participants) {
        const next = item.id === target?.id;
        if (item.isClientProductOwner !== next) {
          item.isClientProductOwner = next;
          item.version++;
        }
      }
      record.detail.clientProductOwner = target
        ? {
            participantId: target.id,
            userId: target.userId,
            displayName: target.displayName,
            assignedAt: new Date().toISOString(),
            assignedByUserId: current.person.id,
          }
        : null;
      recordEvent(
        record,
        current,
        "ClientProductOwnerAssigned",
        target
          ? `${target.displayName ?? "Name unavailable"} assigned as client Product Owner`
          : "Client Product Owner removed",
      );
      return present(record, current);
    },
  };
  return methods;
}
