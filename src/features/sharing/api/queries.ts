import {
  queryOptions,
  infiniteQueryOptions,
  mutationOptions,
} from "@tanstack/react-query";
import { getSharingRepository } from "@/features/sharing/api/sharingRepository";
import type { ShareableItem } from "@/features/sharing/api/types";
import { workspaceScopeKey, type WorkspaceScope } from "@/lib/query/queryScope";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
export interface SharingScope extends WorkspaceScope {
  generation: number;
}
export const sharingProjectKey = (scope: SharingScope, id: string) =>
  [...workspaceScopeKey(scope), "project", id] as const;
export const sharingKey = (scope: SharingScope, id: string) =>
  [...sharingProjectKey(scope, id), "shares"] as const;
export function isCurrentSharingScope(scope: SharingScope) {
  const session = authSession.getSnapshot();
  return (
    session.status === "authenticated" &&
    session.userId === scope.accountId &&
    authSession.version() === scope.generation
  );
}
function assert(scope: SharingScope) {
  if (!isCurrentSharingScope(scope))
    throw new ApiError("cancelled", "The session changed.");
}
export const sharingRepositoryKind = () => getSharingRepository().kind;
function read<T>(
  scope: SharingScope,
  key: readonly unknown[],
  load: (signal: AbortSignal) => Promise<T>,
) {
  return queryOptions({
    queryKey: key,
    queryFn: async ({ signal }) => {
      assert(scope);
      const result = await load(signal);
      assert(scope);
      return result;
    },
  });
}
export const sharesQuery = (scope: SharingScope, id: string) =>
  read(scope, sharingKey(scope, id), (signal) =>
    getSharingRepository().list(scope.workspaceId, id, signal),
  );
export const sharingContextQuery = (scope: SharingScope, id: string) =>
  read(scope, [...sharingKey(scope, id), "context"], (signal) =>
    getSharingRepository().context(scope.workspaceId, id, signal),
  );
export function sharingHistoryQuery(scope: SharingScope, id: string) {
  return infiniteQueryOptions({
    queryKey: [...sharingKey(scope, id), "history"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ signal, pageParam }) => {
      assert(scope);
      const result = await getSharingRepository().history(
        scope.workspaceId,
        id,
        { cursor: pageParam },
        signal,
      );
      assert(scope);
      return result;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export type SharingWrite =
  | { action: "share"; item: ShareableItem }
  | {
      action: "withdraw";
      shareId: string;
      expectedVersion: number;
      reason: string | null;
    };
export function sharingWriteMutation(scope: SharingScope, id: string) {
  return mutationOptions({
    mutationKey: [...sharingKey(scope, id), "write"],
    retry: false,
    mutationFn: async (input: SharingWrite) => {
      assert(scope);
      const repo = getSharingRepository(),
        result =
          input.action === "share"
            ? await repo.share(scope.workspaceId, id, input.item)
            : await repo.withdraw(scope.workspaceId, id, input.shareId, {
                expectedVersion: input.expectedVersion,
                reason: input.reason,
              });
      assert(scope);
      return result;
    },
  });
}
