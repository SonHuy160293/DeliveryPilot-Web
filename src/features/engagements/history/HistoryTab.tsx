import { useInfiniteQuery } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { ReadState, LoadMore } from "@/components/ReadState";
import { formatInstant } from "@/lib/format";
import {
  engagementHistoryQuery,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import type { EngagementHistoryEntry } from "@/features/engagements/api/types";
import {
  engagementEventLabel,
  historyChanges,
} from "@/features/engagements/history/historyPresentation";

export function HistoryTab({
  scope,
  engagementId,
  people,
}: {
  scope: EngagementScope;
  engagementId: string;
  people: Readonly<Record<string, string>>;
}) {
  const options = engagementHistoryQuery(scope, engagementId);
  const query = useInfiniteQuery(options);
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const columns: DataTableColumn<EngagementHistoryEntry>[] = [
    {
      id: "event",
      header: "Event",
      cell: (row) => engagementEventLabel(row.eventType),
    },
    {
      id: "actor",
      header: "Changed by",
      cell: (row) => people[row.actorUserId] ?? "Name unavailable",
    },
    {
      id: "when",
      header: "When",
      cell: (row) => formatInstant(row.occurredAt),
    },
    {
      id: "reason",
      header: "Reason",
      cell: (row) => row.reason ?? "Not recorded",
    },
  ];
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-label="Engagement history"
    >
      <h2 className="text-xl font-semibold">History</h2>
      <ReadState
        query={query}
        queryKey={options.queryKey}
        scope="engagement history"
        empty={rows.length === 0}
        emptyTitle="No history yet"
        emptyDescription="Changes to this engagement will appear here."
      >
        <DataTable
          caption="Engagement history"
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          rowHeader={(row) => (
            <div className="flex flex-col gap-2">
              <span>{engagementEventLabel(row.eventType)}</span>
              {historyChanges(row.details).map((pair) => (
                <p
                  key={pair.label}
                  className="text-sm font-normal text-muted-foreground"
                >
                  {pair.label}: {pair.previous} → {pair.next}
                </p>
              ))}
            </div>
          )}
        />
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetchingNextPage}
          load={() => query.fetchNextPage({ cancelRefetch: false })}
        />
      </ReadState>
    </section>
  );
}
