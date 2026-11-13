import { Link } from "react-router";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadMore } from "@/components/ReadState";
import { Button } from "@/components/ui/button";
import { formatCount, formatDate } from "@/lib/format";
import { workspaceEngagementPath } from "@/lib/routes";
import { statusTone } from "@/lib/statusTone";
import type { EngagementDetail } from "@/features/engagements/api/types";

const columns: readonly DataTableColumn<EngagementDetail>[] = [
  { id: "client", header: "Client", cell: (row) => row.clientDisplayName },
  {
    id: "name",
    header: "Engagement",
    cell: (row) =>
      row.engagementName ?? (
        <span className="text-muted-foreground">Not named</span>
      ),
  },
  {
    id: "reference",
    header: "Reference",
    cell: (row) => row.agreementReference,
  },
  {
    id: "signed",
    header: "Signed",
    cell: (row) => (
      <time dateTime={row.agreementSignedOn}>
        {formatDate(row.agreementSignedOn)}
      </time>
    ),
  },
  {
    id: "milestones",
    header: "Milestones",
    cell: (row) =>
      row.milestones.length
        ? `${formatCount(row.milestones.filter((item) => item.status === "Achieved").length)} of ${formatCount(row.milestones.length)} achieved`
        : "No milestones",
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <StatusBadge label={row.status} tone={statusTone(row.status)} />
    ),
  },
];
export function EngagementTable({
  workspaceId,
  rows,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  workspaceId: string;
  rows: readonly EngagementDetail[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DataTable
        caption="Engagements"
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        rowHeader={(row) => (
          <Button
            variant="link"
            asChild
            className="max-w-full justify-start whitespace-normal px-0 text-left"
          >
            <Link to={workspaceEngagementPath(workspaceId, row.id)}>
              {row.clientDisplayName}
            </Link>
          </Button>
        )}
      />
      <LoadMore more={hasMore} pending={loadingMore} load={onLoadMore} />
    </div>
  );
}
