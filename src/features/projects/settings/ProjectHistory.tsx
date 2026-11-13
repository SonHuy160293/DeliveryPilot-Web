import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { ReadState, LoadMore } from "@/components/ReadState";
import {
  projectHistoryQuery,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { formatInstant } from "@/lib/format";
export function ProjectHistory({
  scope,
  projectId,
}: {
  scope: ProjectScope;
  projectId: string;
}) {
  const options = projectHistoryQuery(scope, projectId),
    query = useInfiniteQuery(options);
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section aria-label="History">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>History</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReadState
            query={query}
            queryKey={options.queryKey}
            scope="Project history"
            empty={!rows.length}
            emptyTitle="No changes recorded yet."
            emptyDescription=""
          >
            <DataTable
              caption="Project history"
              rows={rows}
              rowKey={(row) => row.id}
              rowHeader={(row) => formatInstant(row.occurredAt)}
              columns={[
                { id: "when", header: "When", cell: () => null },
                {
                  id: "who",
                  header: "Who",
                  cell: (row) =>
                    row.actorDisplayName?.trim() || "Name unavailable",
                },
                { id: "change", header: "Change", cell: (row) => row.summary },
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
        </CardContent>
      </Card>
    </section>
  );
}
