import { useState, type MouseEventHandler } from "react";
import { Plus } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { discoveryOptions } from "@/features/workspaces/api/queries";
import { OrganizationCard } from "@/features/workspaces/components/OrganizationCard";
import { OrganizationSearch } from "@/features/workspaces/components/OrganizationSearch";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { RefreshButton } from "@/features/workspaces/components/ApiFeedback";
import { isForbidden } from "@/features/workspaces/model/useDeniedCleanup";

export function WorkspaceCollection({
  owner,
  onCreate,
}: {
  owner: SessionOwner;
  onCreate: MouseEventHandler<HTMLButtonElement>;
}) {
  const [filter, setFilter] = useState("");
  const options = discoveryOptions(owner);
  const query = useInfiniteQuery(options);
  const items = isForbidden(query.error)
    ? []
    : (query.data?.pages.flatMap((page) => page.items) ?? []);
  const matching = items.filter((item) =>
    item.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()),
  );
  return (
    <section
      aria-labelledby="workspaces-section-heading"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              id="workspaces-section-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Workspaces
            </h1>
            {items.length > 0 ? (
              <Badge className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                All ({String(items.length)})
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Your active memberships, all in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {items.length ? (
            <OrganizationSearch value={filter} onChange={setFilter} />
          ) : null}
          <div className="flex items-center gap-3">
            <RefreshButton refresh={query.refetch} pending={query.isFetching} />
            <Button type="button" className="min-h-11" onClick={onCreate}>
              <Plus aria-hidden="true" />
              <span>Create workspace</span>
            </Button>
          </div>
        </div>
      </div>
      <ReadState query={query} queryKey={options.queryKey} scope="Workspaces">
        {!items.length && !query.hasNextPage ? (
          <EmptyState
            title="No workspaces yet"
            description="Create a workspace, or open an invitation from your email. Signing in alone does not create membership."
            action={
              <Button variant="outline" type="button" onClick={onCreate}>
                Create your first workspace
              </Button>
            }
          />
        ) : matching.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {matching.map((workspace) => (
              <OrganizationCard
                key={workspace.organizationId}
                workspace={workspace}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p role="status" className="text-sm text-muted-foreground">
                No matching loaded workspaces.{" "}
                {query.hasNextPage
                  ? "Load more workspaces to continue."
                  : "Try another name."}
              </p>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-center">
          <LoadMore
            more={query.hasNextPage}
            pending={query.isFetching}
            load={query.fetchNextPage}
          />
        </div>
      </ReadState>
    </section>
  );
}
