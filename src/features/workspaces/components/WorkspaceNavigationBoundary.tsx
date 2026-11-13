import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenState } from "@/components/ScreenState";
import {
  myMembershipOptions,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { useWorkspaceNavigation } from "@/features/workspaces/model/useWorkspaceNavigation";
import { clearWorkspaceCache } from "@/lib/query/queryScope";
import type { WorkspaceNavigation } from "@/lib/workspaceNavigation";

type RenderShell = (
  navigation: WorkspaceNavigation,
  content?: ReactNode,
) => ReactNode;

/** Own workspace cleanup for the entire shell, including nested delivery routes. */
export function WorkspaceNavigationBoundary({
  scope,
  children,
}: {
  scope: ScopedOwner;
  children: RenderShell;
}) {
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
    <NavigationReads scope={scope}>{children}</NavigationReads>
  ) : (
    children(
      {
        workspaceId: scope.workspaceId,
        engagements: false,
        clientLinks: false,
        projectRecovery: false,
      },
      <ScreenState status="loading" scope="Workspace access" />,
    )
  );
}

function NavigationReads({
  scope,
  children,
}: {
  scope: ScopedOwner;
  children: RenderShell;
}) {
  const me = useQuery(myMembershipOptions(scope));
  const current = me.isFetchedAfterMount && !me.error ? me.data : undefined;
  const navigation = useWorkspaceNavigation(scope, current);
  return children(navigation);
}
