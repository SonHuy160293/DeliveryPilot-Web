import { useInfiniteQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { ReadState, LoadMore } from "@/components/ReadState";
import {
  sharingHistoryQuery,
  type SharingScope,
} from "@/features/sharing/api/queries";
import { formatInstant } from "@/lib/format";
export function SharingHistory({
  scope,
  projectId,
}: {
  scope: SharingScope;
  projectId: string;
}) {
  const options = sharingHistoryQuery(scope, projectId),
    query = useInfiniteQuery(options);
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <details className="min-w-0">
      <summary className="cursor-pointer rounded-sm py-3 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        History
      </summary>
      <ReadState
        query={query}
        queryKey={options.queryKey}
        scope="Sharing history"
        empty={!rows.length}
        emptyTitle="No changes recorded yet."
        emptyDescription=""
      >
        <DataTable
          caption="Sharing history"
          rows={rows}
          rowKey={(row) => row.id}
          rowHeader={(row) => formatInstant(row.occurredAt)}
          columns={[
            { id: "when", header: "When", cell: () => null },
            {
              id: "who",
              header: "Who",
              cell: (row) => row.actorDisplayName?.trim() || "Name unavailable",
            },
            { id: "item", header: "Item", cell: (row) => row.itemLabel },
            { id: "action", header: "Action", cell: (row) => row.action },
            {
              id: "reason",
              header: "Reason",
              cell: (row) => row.reason ?? "—",
            },
          ]}
        />
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          load={() => query.fetchNextPage({ cancelRefetch: false })}
        />
      </ReadState>
    </details>
  );
}
