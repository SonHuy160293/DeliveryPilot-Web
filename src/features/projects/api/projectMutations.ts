import { mutationOptions } from "@tanstack/react-query";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import {
  assertProjectScope,
  projectKey,
  type ProjectScope,
} from "@/features/projects/api/queryScope";
import type {
  UpdateBriefItemRequest,
  ActivateProjectRequest,
  ProjectKind,
  ProjectRoleCode,
  GuestInvitation,
  Stakeholder,
} from "@/features/projects/api/types";
export type ProjectWrite =
  | { action: "updateBriefItem"; request: UpdateBriefItemRequest }
  | { action: "setSprintLength"; weeks: 1 | 2 | 3 | 4; expectedVersion: number }
  | {
      action: "changeEngagement";
      request: {
        expectedVersion: number;
        kind: ProjectKind;
        engagementId: string | null;
        reason: string;
      };
    }
  | { action: "activate"; request: ActivateProjectRequest }
  | {
      action: "addParticipant";
      request: { userId: string; roles: ProjectRoleCode[] };
    }
  | {
      action: "changeRoles";
      participantId: string;
      request: { roles: ProjectRoleCode[]; expectedVersion: number };
    }
  | {
      action: "endParticipation";
      participantId: string;
      request: { expectedVersion: number; reason: string | null };
    }
  | {
      action: "assignClientPo";
      participantId: string | null;
      expectedVersion: number;
    }
  | {
      action: "inviteGuest";
      request: {
        recipientEmail: string;
        offeredRoleCode: GuestInvitation["offeredRoleCode"];
      };
    }
  | {
      action: "resendInvitation" | "cancelInvitation";
      invitationId: string;
      expectedVersion: number;
    }
  | {
      action: "saveStakeholder";
      stakeholderId: string | null;
      request: Omit<Stakeholder, "id" | "retiredAt">;
    }
  | {
      action: "retireStakeholder";
      stakeholderId: string;
      expectedVersion: number;
    }
  | {
      action: "appointAdministrator";
      request: { participantId: string; reason: string };
    };
export function projectWriteMutation(scope: ProjectScope, id: string) {
  return mutationOptions({
    mutationKey: [...projectKey(scope, id), "write"],
    retry: false,
    mutationFn: async (input: ProjectWrite) => {
      assertProjectScope(scope);
      const repo = getProjectRepository(),
        wid = scope.workspaceId;
      const result = await (() => {
        switch (input.action) {
          case "updateBriefItem":
            return repo.updateBriefItem(wid, id, input.request);
          case "setSprintLength":
            return repo.setSprintLength(
              wid,
              id,
              input.weeks,
              input.expectedVersion,
            );
          case "changeEngagement":
            return repo.changeEngagement(wid, id, input.request);
          case "activate":
            return repo.activate(wid, id, input.request);
          case "addParticipant":
            return repo.addParticipant(wid, id, input.request);
          case "changeRoles":
            return repo.changeRoles(
              wid,
              id,
              input.participantId,
              input.request,
            );
          case "endParticipation":
            return repo.endParticipation(
              wid,
              id,
              input.participantId,
              input.request,
            );
          case "assignClientPo":
            return repo.assignClientPo(
              wid,
              id,
              input.participantId,
              input.expectedVersion,
            );
          case "inviteGuest":
            return repo.inviteGuest(wid, id, input.request);
          case "resendInvitation":
          case "cancelInvitation":
            return repo[input.action](
              wid,
              id,
              input.invitationId,
              input.expectedVersion,
            );
          case "saveStakeholder":
            return repo.saveStakeholder(
              wid,
              id,
              input.stakeholderId,
              input.request,
            );
          case "retireStakeholder":
            return repo.retireStakeholder(
              wid,
              id,
              input.stakeholderId,
              input.expectedVersion,
            );
          case "appointAdministrator":
            return repo.appointAdministrator(wid, id, input.request);
        }
      })();
      assertProjectScope(scope);
      return result;
    },
  });
}
