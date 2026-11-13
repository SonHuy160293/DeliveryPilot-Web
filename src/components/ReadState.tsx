import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/apiError";
import { ScreenState } from "@/components/ScreenState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { ApiFeedback } from "@/components/ApiFeedback";
import { isForbidden, useDeniedCleanup } from "@/lib/query/useDeniedCleanup";

interface ReadQuery {
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  data?: unknown;
  refetch: () => unknown;
  hasNextPage?: boolean;
}
export function ReadState({
  query,
  queryKey,
  scope,
  empty = false,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  query: ReadQuery;
  queryKey: readonly unknown[];
  scope: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}) {
  useDeniedCleanup(query.error, queryKey);
  const client = useQueryClient();
  if (query.isPending) return <ScreenState status="loading" scope={scope} />;
  if (isForbidden(query.error) || (!query.data && query.error))
    return (
      <div className="flex flex-col gap-3">
        <ApiFeedback error={query.error} />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (
              query.error instanceof ApiError &&
              query.error.details.status === 400
            )
              void client.resetQueries({ queryKey });
            else void query.refetch();
          }}
        >
          Retry loading {scope.toLowerCase()}
        </Button>
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {query.error ? (
        <>
          <ApiFeedback error={query.error} />
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch();
            }}
          >
            Retry refreshing {scope.toLowerCase()}
          </Button>
        </>
      ) : null}
      {query.isFetching ? (
        <p role="status" className="text-sm text-muted-foreground">
          Updating {scope.toLowerCase()}…
        </p>
      ) : null}
      {empty && !query.hasNextPage ? (
        <EmptyState
          title={emptyTitle ?? `No ${scope.toLowerCase()} found`}
          description={
            emptyDescription ??
            "There are no items for the current filters. Choose another filter or use an available action."
          }
          action={emptyAction}
        />
      ) : (
        children
      )}
    </div>
  );
}
export function LoadMore({
  more,
  pending,
  load,
}: {
  more: boolean;
  pending: boolean;
  load: () => unknown;
}) {
  return more ? (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        void load();
      }}
    >
      {pending ? "Loading more…" : "Load more"}
    </Button>
  ) : null;
}
