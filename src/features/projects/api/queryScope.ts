import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import { workspaceScopeKey, type WorkspaceScope } from "@/lib/query/queryScope";
export interface ProjectScope extends WorkspaceScope {
  generation: number;
}
export const projectsKey = (scope: WorkspaceScope) =>
  [...workspaceScopeKey(scope), "projects"] as const;
export const projectKey = (scope: WorkspaceScope, id: string) =>
  [...workspaceScopeKey(scope), "project", id] as const;
export function isCurrentProjectScope(
  scope: Pick<ProjectScope, "accountId" | "generation">,
) {
  const session = authSession.getSnapshot();
  return (
    session.status === "authenticated" &&
    session.userId === scope.accountId &&
    authSession.version() === scope.generation
  );
}
export function assertProjectScope(
  scope: Pick<ProjectScope, "accountId" | "generation">,
) {
  if (!isCurrentProjectScope(scope))
    throw new ApiError("cancelled", "The session changed.");
}
