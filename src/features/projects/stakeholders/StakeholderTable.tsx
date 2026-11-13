import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StakeholderDetails } from "@/features/projects/stakeholders/StakeholderDetails";
import { StakeholderDialog } from "@/features/projects/stakeholders/StakeholderDialog";
import { RetireStakeholder } from "@/features/projects/stakeholders/RetireStakeholder";
import type {
  Stakeholder,
  Participant,
  ProjectDetail,
} from "@/features/projects/api/types";
import type { ProjectScope } from "@/features/projects/api/queries";
import type { StakeholderActions } from "@/features/projects/model/useStakeholderActions";
import type { ProjectShareBadgeComponent } from "@/features/projects/brief/shareTypes";
export function StakeholderTable({
  rows,
  participants,
  project,
  scope,
  actions,
  ShareBadgeComponent,
  onRetired,
}: {
  rows: Stakeholder[];
  participants: Participant[];
  project: ProjectDetail;
  scope: ProjectScope;
  actions: StakeholderActions;
  ShareBadgeComponent?: ProjectShareBadgeComponent;
  onRetired: () => void;
}) {
  const columns: DataTableColumn<Stakeholder>[] = [
    { id: "name", header: "Name", cell: () => null },
    { id: "side", header: "Side", cell: (row) => row.side },
    {
      id: "organization",
      header: "Organization",
      cell: (row) => row.organizationName ?? "Not recorded",
    },
    {
      id: "decisions",
      header: "Decision areas",
      cell: (row) => row.decisionAreas ?? "Not recorded",
    },
  ];
  if (project.myParticipantKind === "Member" && ShareBadgeComponent)
    columns.push({
      id: "shared",
      header: "Shared",
      cell: (row) => (
        <ShareBadgeComponent
          scope={scope}
          projectId={project.id}
          canManage={project.permissions.share}
          item={{ stakeholderId: row.id }}
          label={row.name}
        />
      ),
    });
  columns.push({
    id: "details",
    header: "Details",
    cell: (row) => (
      <StakeholderDetails stakeholder={row} participants={participants} />
    ),
  });
  if (project.permissions.editStakeholders)
    columns.push({
      id: "actions",
      header: "Actions",
      cell: (row) =>
        !row.retiredAt ? (
          <div className="flex flex-wrap gap-2">
            <StakeholderDialog
              stakeholder={row}
              participants={participants}
              actions={actions}
            />
            <RetireStakeholder
              stakeholder={row}
              actions={actions}
              onRetired={onRetired}
            />
          </div>
        ) : null,
    });
  return (
    <DataTable
      caption="Stakeholders"
      rows={rows}
      rowKey={(row) => row.id}
      columns={columns}
      rowHeader={(row) => (
        <div className="flex flex-wrap items-start gap-2">
          <span>{row.name}</span>
          {row.retiredAt ? <StatusBadge label="Retired" tone="ended" /> : null}
        </div>
      )}
    />
  );
}
