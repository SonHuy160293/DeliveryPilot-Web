import type { ProjectRepository } from "@/features/projects/api/projectRepository";
import type { ProjectWorkspace } from "@/features/projects/api/mockSupport";
import {
  before,
  access,
  requireAbility,
  parse,
  checkVersion,
  recordEvent,
} from "@/features/projects/api/mockSupport";
import {
  projectConflict,
  projectNotFound,
} from "@/features/projects/api/projectErrors";
import * as shapes from "@/features/projects/api/contracts";
import { ApiError } from "@/lib/api/apiError";
import type { ProjectSharingAdapter } from "@/features/projects/api/sharingAdapter";
export function createMockProjectStakeholders(
  store: (workspaceId: string) => ProjectWorkspace,
  sharing: ProjectSharingAdapter,
) {
  const methods: Pick<
    ProjectRepository,
    "listStakeholders" | "saveStakeholder" | "retireStakeholder"
  > = {
    async listStakeholders(workspaceId, id, includeRetired, signal) {
      const current = await before("projects.listStakeholders", signal),
        { record, participant, permissions } = access(
          store(workspaceId),
          id,
          current,
          true,
        );
      if (participant.kind === "Guest")
        requireAbility(permissions, "editStakeholders");
      const rows = record.stakeholders.filter(
        (item) =>
          (participant.kind !== "Guest" && includeRetired) ||
          item.retiredAt === null,
      );
      return structuredClone(
        participant.kind === "Guest"
          ? rows.map((item) => ({ ...item, email: null, participantId: null }))
          : rows,
      );
    },
    async saveStakeholder(workspaceId, id, stakeholderId, input) {
      const current = await before("projects.saveStakeholder"),
        request = parse(shapes.saveStakeholderRequest, input);
      const { record, participant, permissions } = access(
        store(workspaceId),
        id,
        current,
        true,
      );
      requireAbility(permissions, "editStakeholders");
      if (
        request.participantId &&
        !record.participants.some(
          (item) =>
            item.id === request.participantId && item.status === "Active",
        )
      )
        throw new ApiError("validation", "Check the highlighted fields.", {
          status: 422,
          fieldErrors: {
            participantId: ["Choose someone on the team, or leave this empty."],
          },
        });
      let target = record.stakeholders.find(
        (item) => item.id === stakeholderId,
      );
      if (stakeholderId) {
        if (!target) projectNotFound();
        checkVersion(target.version, request.version);
        if (target.retiredAt) projectConflict();
        const privateFields = {
          email: target.email,
          participantId: target.participantId,
        };
        Object.assign(
          target,
          request,
          participant.kind === "Guest" ? privateFields : {},
          { version: target.version + 1 },
        );
      } else {
        if (
          participant.kind === "Guest" &&
          (request.email || request.participantId)
        )
          projectConflict();
        target = {
          ...request,
          id: crypto.randomUUID(),
          retiredAt: null,
          version: 1,
        };
        record.stakeholders.push(target);
      }
      recordEvent(record, current, "StakeholderSaved", "Stakeholder saved");
      return structuredClone(
        participant.kind === "Guest"
          ? { ...target, email: null, participantId: null }
          : target,
      );
    },
    async retireStakeholder(workspaceId, id, stakeholderId, expectedVersion) {
      const current = await before("projects.retireStakeholder"),
        { record, permissions } = access(store(workspaceId), id, current, true);
      requireAbility(permissions, "editStakeholders");
      parse(shapes.version, expectedVersion);
      const target = record.stakeholders.find(
        (item) => item.id === stakeholderId,
      );
      if (!target) projectNotFound();
      checkVersion(target.version, expectedVersion);
      if (target.retiredAt) projectConflict();
      target.retiredAt = new Date().toISOString();
      target.version++;
      sharing.withdrawStakeholder({
        workspaceId,
        projectId: id,
        stakeholderId,
        name: target.name,
        actorUserId: current.person.id,
        actorDisplayName: current.person.displayName,
        reason: null,
      });
      recordEvent(record, current, "StakeholderRetired", "Stakeholder retired");
    },
  };
  return methods;
}
