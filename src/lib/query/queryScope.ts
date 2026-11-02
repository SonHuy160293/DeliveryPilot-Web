import type { QueryClient } from "@tanstack/react-query";

export interface WorkspaceScope {
  accountId: string;
  workspaceId: string;
}

/** Cache identity only. It conveys no backend authorization and sends no workspace header. */
export function workspaceScopeKey(scope: WorkspaceScope) {
  if (!scope.accountId.trim() || !scope.workspaceId.trim()) {
    throw new Error("Queries require an explicit account and workspace scope.");
  }
  return ["account", scope.accountId, "workspace", scope.workspaceId] as const;
}

/** Call while scoped UI is unmounted/disabled, before mounting another session's UI. */
export async function clearSessionCache(client: QueryClient): Promise<void> {
  const cancellation = client.cancelQueries();
  client.clear();
  await cancellation;
}

export async function clearWorkspaceCache(
  client: QueryClient,
  scope: WorkspaceScope,
): Promise<void> {
  const queryKey = workspaceScopeKey(scope);
  await client.cancelQueries({ queryKey });
  client.removeQueries({ queryKey });
  for (const mutation of client
    .getMutationCache()
    .findAll({ mutationKey: queryKey }))
    client.getMutationCache().remove(mutation);
}
