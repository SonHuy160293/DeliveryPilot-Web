import { formatNumber } from "@/features/workspaces/model/formatters";
import type { AuditEvent } from "@/features/workspaces/api/auditContracts";

const labels: Readonly<Record<string, string>> = {
  name: "Workspace or role name",
  status: "Status",
  createdByUserId: "Created by",
  userId: "Member account",
  previousStatus: "Previous status",
  newStatus: "New status",
  roleId: "Role identifier",
  grantVersion: "Grant revision",
  previousGrantVersion: "Previous grant revision",
  grantedByUserId: "Granted by",
  grantedAt: "Granted at",
  expiresAt: "Expires at",
  revokedAt: "Revoked at",
  origin: "Definition origin",
  templateVersion: "Template revision",
  previousPermissionSetVersion: "Previous permission revision",
  permissionSetVersion: "Permission revision",
  addedPermissionCodes: "Added permissions",
  removedPermissionCodes: "Removed permissions",
  permissionCodes: "Recorded permissions",
  previousName: "Previous name",
  newName: "New name",
  descriptionChanged: "Description changed",
  code: "Role code",
  retiredAt: "Retired at",
  issuedByUserId: "Offer issuer",
  offeredRoleIds: "Offered roles",
  replacesInvitationId: "Replaced invitation",
  closedByUserId: "Closed by",
  closedAt: "Closed at",
  nominatedByUserId: "Nominated by",
};
export function AuditChanges({ event }: { event: AuditEvent }) {
  return (
    <dl className="grid min-w-0 gap-3 text-sm md:grid-cols-2">
      {Object.entries(event.changes).map(([field, value]) => (
        <div key={field} className="min-w-0">
          <dt className="text-muted-foreground">
            {labels[field] ?? "Recorded change"}
          </dt>
          <dd className="break-all">
            {value === null
              ? "Not recorded"
              : typeof value === "boolean"
                ? value
                  ? "Yes"
                  : "No"
                : Array.isArray(value)
                  ? value.join(", ") || "None"
                  : typeof value === "number"
                    ? formatNumber(value)
                    : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
