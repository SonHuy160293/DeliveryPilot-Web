import { useState, type MouseEventHandler } from "react";
import { SearchX } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { discoveryOptions } from "@/features/workspaces/api/queries";
import { OrganizationCard } from "@/features/workspaces/components/OrganizationCard";
import {
  PortfolioToolbar,
  type PortfolioShape,
} from "@/features/workspaces/components/PortfolioToolbar";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { WorkspaceCreateTile } from "@/features/workspaces/components/WorkspaceCreateTile";
import {
  ALL_ROLES,
  formatLoadedCount,
  isManagedWorkspace,
  PORTFOLIO_TOOLBAR_MIN,
  roleNames,
  shapePortfolio,
} from "@/features/workspaces/model/portfolio";
import { isForbidden } from "@/features/workspaces/model/useDeniedCleanup";

const DEFAULT_SHAPE: PortfolioShape = {
  tab: "all",
  role: ALL_ROLES,
  sort: "default",
  name: "",
  view: "grid",
};

export function WorkspaceCollection({
  owner,
  onCreate,
}: {
  owner: SessionOwner;
  onCreate: MouseEventHandler<HTMLButtonElement>;
}) {
  const [shape, setShape] = useState(DEFAULT_SHAPE);
  const options = discoveryOptions(owner);
  const query = useInfiniteQuery(options);
  const items = isForbidden(query.error)
    ? []
    : (query.data?.pages.flatMap((page) => page.items) ?? []);
  const matching = shapePortfolio(items, shape);
  const more = query.hasNextPage;
  const unfiltered =
    shape.tab === "all" && shape.role === ALL_ROLES && !shape.name.trim();
  return (
    <section
      aria-labelledby="workspaces-section-heading"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="workspaces-section-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Workspaces
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse and open the workspaces you belong to.
        </p>
      </div>
      {items.length >= PORTFOLIO_TOOLBAR_MIN || more ? (
        <PortfolioToolbar
          shape={shape}
          onChange={(next) => {
            setShape((current) => ({ ...current, ...next }));
          }}
          counts={{
            all: formatLoadedCount(items.length, more),
            managed: formatLoadedCount(
              items.filter(isManagedWorkspace).length,
              more,
            ),
          }}
          roles={roleNames(items)}
          refresh={query.refetch}
          refreshing={query.isFetching}
        />
      ) : null}
      <ReadState query={query} queryKey={options.queryKey} scope="Workspaces">
        {!items.length && !more ? (
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
          <div
            className={
              shape.view === "list"
                ? "flex flex-col gap-3"
                : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            }
          >
            {matching.map((workspace) => (
              <OrganizationCard
                key={workspace.organizationId}
                workspace={workspace}
                view={shape.view}
              />
            ))}
            {unfiltered ? (
              <WorkspaceCreateTile onCreate={onCreate} view={shape.view} />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-input p-8 text-center">
            <SearchX aria-hidden="true" className="size-8 text-brand-strong" />
            <p role="status" className="text-sm text-muted-foreground">
              No matching workspaces.{" "}
              {more ? "Load more workspaces to continue." : "Try another name."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="bg-card"
              onClick={() => {
                setShape((current) => ({
                  ...DEFAULT_SHAPE,
                  view: current.view,
                }));
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <div className="flex justify-center">
          <LoadMore
            more={more}
            pending={query.isFetching}
            load={query.fetchNextPage}
          />
        </div>
      </ReadState>
    </section>
  );
}
