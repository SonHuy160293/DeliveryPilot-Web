import { useEffect, type ReactNode } from "react";
import { ApiError } from "@/lib/api/apiError";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { ScreenState } from "@/components/ScreenState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  discoveryOptions,
  myMembershipOptions,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { WorkspacePanels } from "@/features/workspaces/components/WorkspacePanels";
import { ApiFeedback, RefreshButton } from "@/components/ApiFeedback";
import { isForbidden } from "@/lib/query/useDeniedCleanup";
import { isOwner } from "@/features/workspaces/api/request";
import { clearWorkspaceCache } from "@/lib/query/queryScope";
import { ROUTES } from "@/lib/routes";
import type { WorkspaceExtraPanels } from "@/features/workspaces/components/workspaceExtraPanels";

export function WorkspaceAdmission({
  scope,
  children,
  identityUnavailable,
  extraPanels,
}: {
  scope: ScopedOwner;
  children?: (name: string) => ReactNode;
  identityUnavailable?: ReactNode;
  extraPanels?: WorkspaceExtraPanels;
}) {
  const me = useQuery(myMembershipOptions(scope));
  const discovery = useInfiniteQuery(discoveryOptions(scope));
  const name = discovery.data?.pages
    .flatMap((page) => page.items)
    .find(
      (item) =>
        item.organizationId.toLowerCase() === scope.workspaceId.toLowerCase(),
    )?.name;
  const client = useQueryClient();
  const navigate = useNavigate();
  const {
    hasNextPage,
    isFetching,
    error: discoveryError,
    fetchNextPage,
  } = discovery;
  useEffect(() => {
    if (!name && hasNextPage && !isFetching && !discoveryError)
      void fetchNextPage();
  }, [name, hasNextPage, isFetching, discoveryError, fetchNextPage]);
  useEffect(() => {
    if (!isForbidden(me.error)) return;
    void clearWorkspaceCache(client, scope).then(() => {
      if (isOwner(scope))
        void navigate(ROUTES.workspaces, {
          replace: true,
          state: { workspaceDenied: true },
        });
    });
  }, [client, me.error, navigate, scope]);
  if (
    !me.isFetchedAfterMount ||
    me.isPending ||
    (!name &&
      !discovery.error &&
      (discovery.isPending || discovery.hasNextPage))
  )
    return <ScreenState status="loading" scope="Workspace access" />;
  if (
    me.error ||
    !me.data ||
    isForbidden(discovery.error) ||
    (!name && discovery.error)
  )
    if (
      identityUnavailable &&
      [me.error, discovery.error].some(
        (error) => error instanceof ApiError && error.details.status === 503,
      )
    )
      return <>{identityUnavailable}</>;
    else
      return (
        <div className="flex flex-col gap-4">
          <ApiFeedback error={me.error ?? discovery.error} />
          <RefreshButton
            refresh={() => Promise.all([me.refetch(), discovery.refetch()])}
          />
          <Button asChild variant="outline">
            <Link to={ROUTES.workspaces}>Back to workspaces</Link>
          </Button>
        </div>
      );
  if (!name)
    return (
      <EmptyState
        title="Choose a current workspace"
        description="This workspace could not be resolved from your current workspace list. Refresh your selection."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.workspaces}>Back to workspaces</Link>
          </Button>
        }
      />
    );
  if (children) return <>{children(name)}</>;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={name}
        description="Manage your workspace. Each read and action checks current access."
      />
      <WorkspacePanels
        scope={scope}
        me={me.data}
        workspaceName={name}
        extraPanels={extraPanels}
      />
      {discovery.error ? (
        <>
          <ApiFeedback error={discovery.error} />
          <RefreshButton
            refresh={discovery.refetch}
            pending={discovery.isFetching}
          />
        </>
      ) : null}
    </div>
  );
}
