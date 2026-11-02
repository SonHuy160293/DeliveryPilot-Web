import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import type { AuditInput } from "@/features/workspaces/api/auditContracts";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { workspaceScopeKey, type WorkspaceScope } from "@/lib/query/queryScope";

export type ScopedOwner = WorkspaceScope & SessionOwner;
export const discoveryKey = (accountId: string) =>
  ["account", accountId, "workspaces"] as const;
export const personalNominationsKey = (accountId: string) =>
  ["account", accountId, "ownership-nominations"] as const;
export const resourceKey = (scope: WorkspaceScope, resource: string) =>
  [...workspaceScopeKey(scope), resource] as const;
export function discoveryOptions(owner: SessionOwner) {
  return infiniteQueryOptions({
    queryKey: [...discoveryKey(owner.accountId), { limit: 50 }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.discover(owner, { limit: 50, cursor: pageParam }, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function myMembershipOptions(scope: ScopedOwner) {
  return queryOptions({
    queryKey: [...resourceKey(scope, "membership"), "me"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: ({ signal }) => workspaceApi.me(scope, scope.workspaceId, signal),
  });
}
export function membersOptions(
  scope: ScopedOwner,
  status: "active" | "removed" | "suspended" = "active",
) {
  return infiniteQueryOptions({
    queryKey: [...resourceKey(scope, "members"), "list", { status, limit: 50 }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.members(
        scope,
        scope.workspaceId,
        { status, limit: 50, cursor: pageParam },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function memberOptions(scope: ScopedOwner, id: string) {
  return queryOptions({
    queryKey: [...resourceKey(scope, "members"), "detail", id],
    staleTime: 0,
    queryFn: ({ signal }) =>
      workspaceApi.member(scope, scope.workspaceId, id, signal),
  });
}
export function rolesOptions(scope: ScopedOwner) {
  return infiniteQueryOptions({
    queryKey: [...resourceKey(scope, "roles"), "list", { limit: 50 }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.roles(
        scope,
        scope.workspaceId,
        { limit: 50, cursor: pageParam },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function permissionsOptions(scope: ScopedOwner) {
  return queryOptions({
    queryKey: [...resourceKey(scope, "permissions"), "delegable"],
    queryFn: ({ signal }) =>
      workspaceApi.permissions(scope, scope.workspaceId, signal),
  });
}
export type OfferStatus =
  "pending" | "accepted" | "declined" | "cancelled" | "expired";
export function invitationsOptions(
  scope: ScopedOwner,
  status: OfferStatus = "pending",
) {
  return infiniteQueryOptions({
    queryKey: [
      ...resourceKey(scope, "invitations"),
      "list",
      { status, limit: 50 },
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.invitations(
        scope,
        scope.workspaceId,
        { status, limit: 50, cursor: pageParam },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function invitationOptions(scope: ScopedOwner, id: string) {
  return queryOptions({
    queryKey: [...resourceKey(scope, "invitations"), "detail", id],
    staleTime: 0,
    queryFn: ({ signal }) =>
      workspaceApi.invitation(scope, scope.workspaceId, id, signal),
  });
}
export function nominationsOptions(
  scope: ScopedOwner,
  status: OfferStatus = "pending",
) {
  return infiniteQueryOptions({
    queryKey: [
      ...resourceKey(scope, "nominations"),
      "list",
      { status, limit: 50 },
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.nominations(
        scope,
        scope.workspaceId,
        { status, limit: 50, cursor: pageParam },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function personalNominationsOptions(
  owner: SessionOwner,
  status: OfferStatus = "pending",
) {
  return infiniteQueryOptions({
    queryKey: [
      ...personalNominationsKey(owner.accountId),
      { status, limit: 50 },
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.myNominations(
        owner,
        { status, limit: 50, cursor: pageParam },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function auditOptions(
  scope: ScopedOwner,
  filters: Omit<AuditInput, "cursor">,
) {
  return infiniteQueryOptions({
    queryKey: [
      ...resourceKey(scope, "audit"),
      "list",
      { ...filters, limit: 50 },
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      workspaceApi.audit(
        scope,
        scope.workspaceId,
        { ...filters, limit: 50, cursor: pageParam },
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
