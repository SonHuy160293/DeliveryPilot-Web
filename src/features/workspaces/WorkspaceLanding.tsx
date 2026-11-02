import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ScreenState } from "@/components/ScreenState";
import { Button } from "@/components/ui/button";
import { uuid } from "@/features/workspaces/api/contracts";
import { WorkspaceAdmission } from "@/features/workspaces/components/WorkspaceAdmission";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { clearWorkspaceCache } from "@/lib/query/queryScope";
import { ROUTES } from "@/lib/routes";
import type { ScopedOwner } from "@/features/workspaces/api/queries";

export function WorkspaceLanding({ owner }: { owner: SessionOwner }) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const parsed = uuid.safeParse(workspaceSlug);
  const workspaceId = parsed.success ? parsed.data : undefined;
  const { accountId, generation } = owner;
  const scope = useMemo(
    () => (workspaceId ? { accountId, generation, workspaceId } : undefined),
    [accountId, generation, workspaceId],
  );
  if (!scope)
    return (
      <EmptyState
        title="Choose a workspace"
        description="This address does not contain a valid workspace identifier."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.workspaces}>Back to workspaces</Link>
          </Button>
        }
      />
    );
  return (
    <ScopeTransition
      key={`${scope.accountId}:${String(scope.generation)}:${scope.workspaceId}`}
      scope={scope}
    />
  );
}
function ScopeTransition({ scope }: { scope: ScopedOwner }) {
  const client = useQueryClient();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const oldIds = new Set(
      client
        .getQueryCache()
        .findAll({ queryKey: ["account", scope.accountId, "workspace"] })
        .map((query) => query.queryKey[3])
        .filter((id): id is string => typeof id === "string"),
    );
    void Promise.all(
      [...oldIds].map((workspaceId) =>
        clearWorkspaceCache(client, {
          accountId: scope.accountId,
          workspaceId,
        }),
      ),
    ).then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
      void clearWorkspaceCache(client, scope);
    };
  }, [client, scope]);
  return ready ? (
    <WorkspaceAdmission scope={scope} />
  ) : (
    <ScreenState status="loading" scope="Workspace access" />
  );
}
