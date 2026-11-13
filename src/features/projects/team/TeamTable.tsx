import { DataTable } from "@/components/DataTable";
import { PersonCell } from "@/components/PersonCell";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { projectRoleLabel } from "@/features/projects/model/roleLabels";
import type {
  Participant,
  ProjectPermissions,
} from "@/features/projects/api/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { ManageParticipantDialog } from "@/features/projects/team/ManageParticipantDialog";
export function TeamTable({
  rows,
  permissions,
  actions,
  loading = false,
}: {
  rows: Participant[];
  permissions: ProjectPermissions;
  actions: ProjectTeamActions;
  loading?: boolean;
}) {
  return (
    <DataTable
      caption="Project team"
      loading={loading}
      rows={rows}
      rowKey={(row) => row.id}
      rowHeader={(row) => (
        <PersonCell
          userId={row.userId}
          displayName={row.displayName}
          secondary={row.primaryEmail ?? undefined}
        />
      )}
      columns={[
        { id: "person", header: "Person", cell: () => null },
        {
          id: "kind",
          header: "Type",
          cell: (row) => <StatusBadge label={row.kind} tone="neutral" />,
        },
        {
          id: "roles",
          header: "Roles",
          cell: (row) => (
            <div className="flex flex-wrap gap-2">
              {row.roles.map((role) => (
                <Badge variant="outline" key={role}>
                  {projectRoleLabel(role)}
                </Badge>
              ))}
              {row.isClientProductOwner ? (
                <Badge variant="outline">Client PO</Badge>
              ) : null}
            </div>
          ),
        },
        {
          id: "since",
          header: "Since",
          cell: (row) => formatDate(row.activeSince.slice(0, 10)),
        },
        {
          id: "actions",
          header: "Actions",
          srOnlyHeader: true,
          cell: (row) =>
            (
              row.kind === "Guest"
                ? permissions.manageGuests
                : permissions.manageParticipants
            ) ? (
              <ManageParticipantDialog
                participant={row}
                permissions={permissions}
                actions={actions}
              />
            ) : null,
        },
      ]}
    />
  );
}
