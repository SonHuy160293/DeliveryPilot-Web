import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Invitation } from "@/features/workspaces/api/contracts";
import { formatInstant, formatNumber, formatStatus } from "@/lib/format";

export function InvitationSummary({ invitation }: { invitation: Invitation }) {
  const [now] = useState(() => Date.now());
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="break-all text-lg font-semibold">
        {invitation.recipientEmail}
      </h3>
      <p className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          Offer: {formatStatus(invitation.status)}
        </Badge>
        <Badge variant="outline">
          Delivery:{" "}
          {invitation.delivery.status === "provider-accepted"
            ? "Accepted by email provider"
            : invitation.delivery.status}
        </Badge>
      </p>
      <p className="text-sm">
        Offer deadline: {formatInstant(invitation.expiresAt)}.
        {invitation.status === "pending" &&
        Date.parse(invitation.expiresAt) < now
          ? " The deadline has passed; the offer may still be marked pending."
          : ""}
      </p>
      <ul className="flex flex-col gap-2 text-sm">
        {invitation.offeredRoles.map((role) => (
          <li key={role.roleId} className="break-words">
            {role.name}
          </li>
        ))}
      </ul>
      <details>
        <summary className="cursor-pointer text-sm">Offer details</summary>
        <ul className="flex flex-col gap-2 text-sm">
          {invitation.offeredRoles.map((role) => (
            <li key={role.roleId} className="break-words">
              {role.name} · permission revision{" "}
              {formatNumber(role.permissionSetVersion)}
            </li>
          ))}
        </ul>
      </details>
      <p className="text-sm text-muted-foreground">
        Delivery updated {formatInstant(invitation.delivery.updatedAt)}.
        Delivery is separate from membership acceptance.
      </p>
      {invitation.delivery.failureCode ? (
        <p className="break-words text-sm">
          Delivery failure: {invitation.delivery.failureCode}
        </p>
      ) : null}
    </div>
  );
}
