import { queryOptions, mutationOptions } from "@tanstack/react-query";
import { getPortalRepository } from "@/features/portal/api/portalRepository";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import type {
  UpdateBriefItemRequest,
  Stakeholder,
} from "@/features/projects/api/types";
export interface PortalScope {
  accountId: string;
  generation: number;
}
export const portalKey = (scope: PortalScope) =>
  ["account", scope.accountId, "portal"] as const;
export function assertPortalScope(scope: PortalScope) {
  const session = authSession.getSnapshot();
  if (
    session.status !== "authenticated" ||
    session.userId !== scope.accountId ||
    authSession.version() !== scope.generation
  )
    throw new ApiError("cancelled", "The session changed.");
}
function read<T>(
  scope: PortalScope,
  key: readonly unknown[],
  load: (signal: AbortSignal) => Promise<T>,
) {
  return queryOptions({
    queryKey: key,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      assertPortalScope(scope);
      const data = await load(signal);
      assertPortalScope(scope);
      return data;
    },
  });
}
export const portalRepositoryKind = () => getPortalRepository().kind;
export const guestProjectsQuery = (scope: PortalScope) =>
  read(scope, [...portalKey(scope), "projects"], () =>
    getPortalRepository().list(),
  );
export const guestProjectViewQuery = (scope: PortalScope, id: string) =>
  read(scope, [...portalKey(scope), "project", id], (signal) =>
    getPortalRepository().view(id, signal),
  );
export const portalPreviewQuery = (
  scope: PortalScope & { workspaceId: string },
  id: string,
) =>
  read(
    scope,
    [
      "account",
      scope.accountId,
      "workspace",
      scope.workspaceId,
      "project",
      id,
      "shares",
      "preview",
    ],
    (signal) => getPortalRepository().preview(scope.workspaceId, id, signal),
  );
export function portalWriteMutation(scope: PortalScope, id: string) {
  return mutationOptions({
    mutationKey: [...portalKey(scope), "project", id, "write"],
    retry: false,
    mutationFn: async (
      input:
        | { action: "leave" }
        | { action: "brief"; request: UpdateBriefItemRequest }
        | {
            action: "stakeholder";
            stakeholderId: string;
            request: Pick<
              Stakeholder,
              | "name"
              | "side"
              | "organizationName"
              | "responsibilities"
              | "decisionAreas"
              | "version"
            >;
          },
    ) => {
      assertPortalScope(scope);
      const repo = getPortalRepository();
      if (input.action === "leave") await repo.leave(id);
      else if (input.action === "brief")
        await repo.updateBrief(id, input.request);
      else await repo.updateStakeholder(id, input.stakeholderId, input.request);
      assertPortalScope(scope);
    },
  });
}
