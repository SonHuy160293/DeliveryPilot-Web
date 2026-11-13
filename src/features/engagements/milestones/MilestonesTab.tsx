import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import type {
  EngagementDetail,
  EngagementMilestone,
} from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { MilestoneDialog } from "@/features/engagements/milestones/MilestoneDialog";
import { ChangeMilestoneDateDialog } from "@/features/engagements/milestones/ChangeMilestoneDateDialog";
import { ChangeMilestoneStatusDialog } from "@/features/engagements/milestones/ChangeMilestoneStatusDialog";

export function MilestonesTab({
  engagement,
  canManage,
  actions,
}: {
  engagement: EngagementDetail;
  canManage: boolean;
  actions: EngagementActions;
}) {
  const editable = canManage && engagement.status === "Active";
  const add = canManage ? (
    <div hidden={!editable} className={!editable ? "hidden" : undefined}>
      <MilestoneDialog engagement={engagement} actions={actions} />
    </div>
  ) : undefined;
  const columns: DataTableColumn<EngagementMilestone>[] = [
    { id: "name", header: "Name", cell: (row) => row.name },
    {
      id: "original",
      header: "Original",
      cell: (row) => formatDate(row.originalTargetDate),
    },
    {
      id: "current",
      header: "Current",
      cell: (row) => formatDate(row.currentTargetDate),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge label={row.status} tone={statusTone(row.status)} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <>
          {canManage ? (
            <div
              hidden={!editable || !["Planned", "Missed"].includes(row.status)}
              className={
                !editable || !["Planned", "Missed"].includes(row.status)
                  ? "hidden"
                  : "flex flex-wrap gap-2"
              }
              aria-label={`Actions for ${row.name}`}
            >
              <ChangeMilestoneDateDialog
                engagement={engagement}
                milestoneId={row.id}
                actions={actions}
              />
              <ChangeMilestoneStatusDialog
                engagement={engagement}
                milestoneId={row.id}
                actions={actions}
              />
              <MilestoneDialog
                engagement={engagement}
                milestoneId={row.id}
                actions={actions}
              />
            </div>
          ) : null}
          {!editable || !["Planned", "Missed"].includes(row.status) ? (
            <span>No actions</span>
          ) : null}
        </>
      ),
    },
  ];
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Milestones">
      {engagement.milestones.length === 0 ? (
        <EmptyState
          title="No milestones yet"
          description="Add the delivery dates agreed with the client."
          action={add}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Milestones</h2>
            {add}
          </div>
          <DataTable
            caption="Milestones"
            columns={columns}
            rows={engagement.milestones}
            rowKey={(row) => row.id}
            rowHeader={(row) => (
              <div className="flex flex-col gap-1">
                <span>{row.name}</span>
                {row.description ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {row.description}
                  </span>
                ) : null}
              </div>
            )}
          />
        </>
      )}
    </section>
  );
}
