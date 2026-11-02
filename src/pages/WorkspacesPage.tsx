import { useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthSession } from "@/features/auth/model/useAuthSession";
import { WorkspaceCreateDialog } from "@/features/workspaces/WorkspaceCreateDialog";
import { discoveryOptions } from "@/features/workspaces/api/queries";
import { authSession } from "@/lib/api/authSession";
import type { SessionOwner } from "@/features/workspaces/api/request";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { RoleBadges } from "@/features/workspaces/components/RoleBadges";
import {
  ApiFeedback,
  RefreshButton,
} from "@/features/workspaces/components/ApiFeedback";
import { isRecord } from "@/lib/api/errorNormalizer";
import { PersonalNominations } from "@/features/workspaces/ownership/PersonalNominations";
import { workspaceOverviewPath } from "@/lib/routes";

export function WorkspacesPage() {
  const session = useAuthSession();
  return session.status === "authenticated" ? (
    <WorkspaceDiscovery
      key={`${session.userId}:${String(authSession.version())}`}
      owner={{ accountId: session.userId, generation: authSession.version() }}
    />
  ) : null;
}
function WorkspaceDiscovery({ owner }: { owner: SessionOwner }) {
  const location = useLocation();
  const options = discoveryOptions(owner);
  const query = useInfiniteQuery(options);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const matching = items.filter((item) =>
    item.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()),
  );
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Workspaces"
        description="Choose a workspace, or create one."
        breadcrumbs={[{ label: "Workspaces" }]}
        action={
          <WorkspaceCreateDialog
            owner={owner}
            open={creating}
            onOpenChange={setCreating}
            returnFocusRef={returnFocus}
          />
        }
      />
      <RefreshButton refresh={query.refetch} pending={query.isFetching} />
      {isRecord(location.state) && location.state.workspaceDenied === true ? (
        <ApiFeedback kind="info">
          The selected workspace is unavailable under your current membership.
          Choose another workspace or ask a manager to review access.
        </ApiFeedback>
      ) : null}
      <ReadState query={query} queryKey={options.queryKey} scope="Workspaces">
        {items.length ? (
          <div className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="workspace-filter">Filter loaded workspaces</Label>
            <Input
              id="workspace-filter"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
              }}
            />
          </div>
        ) : null}
        {!items.length && !query.hasNextPage ? (
          <EmptyState
            title="No workspaces yet"
            description="Create a workspace, or open an invitation from your email. Signing in alone does not create membership."
            action={
              <Button
                variant="outline"
                type="button"
                onClick={(event) => {
                  returnFocus.current = event.currentTarget;
                  setCreating(true);
                }}
              >
                Create your first workspace
              </Button>
            }
          />
        ) : matching.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matching.map((workspace) => (
              <Card key={workspace.organizationId} className="min-w-0">
                <CardHeader>
                  <CardTitle className="break-words">
                    {workspace.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <RoleBadges roles={workspace.roles} />
                  <Button asChild variant="outline">
                    <Link
                      aria-label={`Open workspace ${workspace.name}`}
                      to={workspaceOverviewPath(workspace.organizationId)}
                    >
                      Open workspace
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>
            No matching loaded workspaces.{" "}
            {query.hasNextPage
              ? "Load more workspaces to continue."
              : "Try another name."}
          </p>
        )}
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          load={query.fetchNextPage}
        />
      </ReadState>
      <PersonalNominations owner={owner} />
    </div>
  );
}
