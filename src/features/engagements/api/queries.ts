import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from "@tanstack/react-query";
import { linkedProjectProjection } from "@/mocks/linkedProjectsAdapter";
import { clientLinkMock } from "@/features/engagements/api/mockClientLinks";
import { getEngagementRepository } from "@/features/engagements/api/engagementRepository";
import type {
  EngagementStatus,
  CreateEngagementRequest,
  SetContractValueRequest,
  CloseOrReopenEngagementRequest,
  AddMilestoneRequest,
  EditMilestoneRequest,
  ChangeMilestoneDateRequest,
  ChangeMilestoneStatusRequest,
} from "@/features/engagements/api/types";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import { workspaceScopeKey, type WorkspaceScope } from "@/lib/query/queryScope";

export interface EngagementScope extends WorkspaceScope {
  generation: number;
}
export const engagementRepositoryKind = () => getEngagementRepository().kind;
export const engagementsKey = (scope: WorkspaceScope) =>
  [...workspaceScopeKey(scope), "engagements"] as const;
export const engagementKey = (scope: WorkspaceScope, id: string) =>
  [...workspaceScopeKey(scope), "engagement", id] as const;
export function isCurrent(scope: EngagementScope): boolean {
  const session = authSession.getSnapshot();
  return (
    session.status === "authenticated" &&
    session.userId === scope.accountId &&
    authSession.version() === scope.generation
  );
}
function assertCurrent(scope: EngagementScope) {
  if (!isCurrent(scope))
    throw new ApiError("cancelled", "The session changed.");
}
export function engagementCapabilitiesQuery(scope: EngagementScope) {
  return queryOptions({
    queryKey: [...engagementsKey(scope), "capabilities"],
    queryFn: async () => {
      assertCurrent(scope);
      const result = await getEngagementRepository().capabilities();
      assertCurrent(scope);
      return result;
    },
  });
}
export function engagementListQuery(
  scope: EngagementScope,
  status?: EngagementStatus,
) {
  return infiniteQueryOptions({
    queryKey: [...engagementsKey(scope), { status }],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ signal, pageParam }) => {
      assertCurrent(scope);
      const result = await getEngagementRepository().list(
        scope.workspaceId,
        { status, cursor: pageParam, limit: 50 },
        signal,
      );
      assertCurrent(scope);
      return result;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function engagementQuery(scope: EngagementScope, id: string) {
  return queryOptions({
    queryKey: engagementKey(scope, id),
    queryFn: async ({ signal }) => {
      assertCurrent(scope);
      const row = await getEngagementRepository().get(
        scope.workspaceId,
        id,
        signal,
      );
      assertCurrent(scope);
      return row;
    },
  });
}
export function createEngagementMutation(scope: EngagementScope) {
  return mutationOptions({
    mutationKey: [...engagementsKey(scope), "create"],
    retry: false,
    mutationFn: async (input: {
      request: CreateEngagementRequest;
      idempotencyKey: string;
    }) => {
      assertCurrent(scope);
      const result = await getEngagementRepository().create(
        scope.workspaceId,
        input.request,
        input.idempotencyKey,
      );
      assertCurrent(scope);
      return result;
    },
  });
}
export function engagementHistoryQuery(scope: EngagementScope, id: string) {
  return infiniteQueryOptions({
    queryKey: [...engagementKey(scope, id), "history"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ signal, pageParam }) => {
      assertCurrent(scope);
      const result = await getEngagementRepository().history(
        scope.workspaceId,
        id,
        { limit: 50, cursor: pageParam },
        signal,
      );
      assertCurrent(scope);
      return result;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function linkedProjectsQuery(scope: EngagementScope, id: string) {
  return queryOptions({
    queryKey: [...engagementKey(scope, id), "projects"],
    queryFn: async ({ signal }) => {
      assertCurrent(scope);
      await getEngagementRepository().get(scope.workspaceId, id, signal);
      assertCurrent(scope);
      return linkedProjectProjection(scope.workspaceId, id);
    },
  });
}

export function engagementDetailCapabilitiesQuery(scope: EngagementScope) {
  return queryOptions({
    queryKey: [...engagementsKey(scope), "detail-capabilities"],
    queryFn: async () => {
      assertCurrent(scope);
      const result = await getEngagementRepository().detailCapabilities();
      assertCurrent(scope);
      return result;
    },
  });
}

export type EngagementWrite =
  | {
      action: "removeClientLink";
      expectedVersion: number;
      reason: string | null;
    }
  | {
      action: "updateDetails";
      request: import("@/features/engagements/api/types").UpdateEngagementDetailsRequest;
    }
  | {
      action: "upsertContact";
      contactId: string | null;
      request: import("@/features/engagements/api/types").UpsertContactRequest;
    }
  | { action: "removeContact"; contactId: string; expectedVersion: number }
  | { action: "setContractValue"; request: SetContractValueRequest }
  | { action: "close" | "reopen"; request: CloseOrReopenEngagementRequest }
  | { action: "addMilestone"; request: AddMilestoneRequest }
  | {
      action: "editMilestone";
      milestoneId: string;
      request: EditMilestoneRequest;
    }
  | {
      action: "changeMilestoneDate";
      milestoneId: string;
      request: ChangeMilestoneDateRequest;
    }
  | {
      action: "changeMilestoneStatus";
      milestoneId: string;
      request: ChangeMilestoneStatusRequest;
    };

export function engagementWriteMutation(scope: EngagementScope, id: string) {
  return mutationOptions({
    mutationKey: [...engagementKey(scope, id), "write"],
    retry: false,
    mutationFn: async (input: EngagementWrite) => {
      assertCurrent(scope);
      const repo = getEngagementRepository();
      const result = await (() => {
        switch (input.action) {
          case "removeClientLink":
            return repo.removeClientLink(
              scope.workspaceId,
              id,
              input.expectedVersion,
              input.reason,
            );
          case "updateDetails":
            return repo.updateDetails(scope.workspaceId, id, input.request);
          case "upsertContact":
            return repo.upsertContact(
              scope.workspaceId,
              id,
              input.contactId,
              input.request,
            );
          case "removeContact":
            return repo.removeContact(
              scope.workspaceId,
              id,
              input.contactId,
              input.expectedVersion,
            );
          case "setContractValue":
            return repo.setContractValue(scope.workspaceId, id, input.request);
          case "close":
          case "reopen":
            return repo[input.action](scope.workspaceId, id, input.request);
          case "addMilestone":
            return repo.addMilestone(scope.workspaceId, id, input.request);
          case "editMilestone":
            return repo.editMilestone(
              scope.workspaceId,
              id,
              input.milestoneId,
              input.request,
            );
          case "changeMilestoneDate":
            return repo.changeMilestoneDate(
              scope.workspaceId,
              id,
              input.milestoneId,
              input.request,
            );
          case "changeMilestoneStatus":
            return repo.changeMilestoneStatus(
              scope.workspaceId,
              id,
              input.milestoneId,
              input.request,
            );
        }
      })();
      assertCurrent(scope);
      return result;
    },
  });
}
/** Code-bearing calls are imperative and never enter Query or mutation caches. */
export const linkCodeApi = {
  async preview(scope: EngagementScope, code: string) {
    assertCurrent(scope);
    const result = await clientLinkMock.preview(scope.workspaceId, code);
    assertCurrent(scope);
    return result;
  },
  async confirm(scope: EngagementScope, code: string) {
    assertCurrent(scope);
    await clientLinkMock.confirm(scope.workspaceId, code);
    assertCurrent(scope);
  },
};
export const clientLinksQuery = (scope: EngagementScope) =>
  queryOptions({
    queryKey: [...workspaceScopeKey(scope), "client-links"],
    queryFn: async () => {
      assertCurrent(scope);
      const rows = await clientLinkMock.list(scope.workspaceId);
      assertCurrent(scope);
      return rows;
    },
  });
export const removeClientWorkspaceLink = (
  scope: EngagementScope,
  id: string,
  version: number,
) => {
  assertCurrent(scope);
  return clientLinkMock.remove(scope.workspaceId, id, version).then(() => {
    assertCurrent(scope);
  });
};
