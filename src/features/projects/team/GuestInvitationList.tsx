import { DataTable } from "@/components/DataTable";
import { formatDate } from "@/lib/format";
import { projectRoleLabel } from "@/features/projects/model/roleLabels";
import type { GuestInvitation } from "@/features/projects/api/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { TeamConfirmAction } from "@/features/projects/team/TeamConfirmAction";
export function GuestInvitationList({
  invitations,
  actions,
}: {
  invitations: GuestInvitation[];
  actions: ProjectTeamActions;
}) {
  const rows = invitations.filter((item) => item.status === "Pending");
  return (
    <section
      aria-label="Pending guest invitations"
      className="flex flex-col gap-4"
    >
      <h3 className="text-lg font-semibold">
        Pending guest invitations ({rows.length})
      </h3>
      <p className="text-sm text-muted-foreground">
        To offer a different role, cancel and send a new invitation.
      </p>
      {!rows.length ? (
        <p>No pending invitations.</p>
      ) : (
        <DataTable
          caption="Pending guest invitations"
          rows={rows}
          rowKey={(row) => row.id}
          rowHeader={(row) => (
            <span className="break-all">{row.recipientEmail}</span>
          )}
          columns={[
            { id: "email", header: "Email", cell: () => null },
            {
              id: "role",
              header: "Role",
              cell: (row) => projectRoleLabel(row.offeredRoleCode),
            },
            {
              id: "expiry",
              header: "Expires",
              cell: (row) =>
                `Expires ${formatDate(row.expiresAt.slice(0, 10))}`,
            },
            {
              id: "actions",
              header: "Actions",
              srOnlyHeader: true,
              cell: (row) => (
                <div className="flex flex-col gap-2 md:flex-row">
                  <TeamConfirmAction
                    label="Resend"
                    target={row.recipientEmail}
                    consequence="The previous link stops working and a new 7-day link is sent."
                    actions={actions}
                    request={() => ({
                      action: "resendInvitation",
                      invitationId: row.id,
                      expectedVersion: row.version,
                    })}
                    success="Invitation resent."
                  />
                  <TeamConfirmAction
                    label="Cancel invitation"
                    triggerLabel="Cancel"
                    target={row.recipientEmail}
                    consequence="Cancel this pending guest invitation."
                    actions={actions}
                    request={() => ({
                      action: "cancelInvitation",
                      invitationId: row.id,
                      expectedVersion: row.version,
                    })}
                    success="Invitation cancelled."
                  />
                </div>
              ),
            },
          ]}
        />
      )}
    </section>
  );
}
